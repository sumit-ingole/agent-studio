import { existsSync, readFileSync } from 'fs';
import { join, resolve, parse } from 'path';
import { Groq } from 'groq-sdk';
import { z } from 'zod';
import { getComponentPrompt } from '@agent-studio/ai-prompts';
import type { ComponentResponse, APIErrorResponse } from '@agent-studio/types';

function getEnvValueFromFile(filePath: string, key: string): string | undefined {
  if (!existsSync(filePath)) return undefined;

  const contents = readFileSync(filePath, 'utf8');
  const lines = contents.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [envKey, ...rest] = trimmed.split('=');
    if (envKey?.trim() === key) {
      return rest.join('=').trim();
    }
  }

  return undefined;
}

function findFileUp(filename: string, startDir: string): string | undefined {
  let currentDir = resolve(startDir);
  const root = parse(currentDir).root;

  while (true) {
    const candidate = join(currentDir, filename);
    if (existsSync(candidate)) return candidate;
    if (currentDir === root) break;
    currentDir = resolve(currentDir, '..');
  }

  return undefined;
}

function resolveGroqApiKey(): string | undefined {
  const cwdEnv = findFileUp('.env.local', process.cwd());
  const appEnv = findFileUp('.env.local', join(process.cwd(), '..'));

  return (
    process.env.GROQ_API_KEY ||
    process.env.NEXT_PUBLIC_GROQ_API_KEY ||
    (cwdEnv && getEnvValueFromFile(cwdEnv, 'GROQ_API_KEY')) ||
    (cwdEnv && getEnvValueFromFile(cwdEnv, 'NEXT_PUBLIC_GROQ_API_KEY')) ||
    (appEnv && getEnvValueFromFile(appEnv, 'GROQ_API_KEY')) ||
    (appEnv && getEnvValueFromFile(appEnv, 'NEXT_PUBLIC_GROQ_API_KEY'))
  );
}

const GROQ_API_KEY = resolveGroqApiKey();
const groq = new Groq({
  apiKey: GROQ_API_KEY || '',
});

const RequestSchema = z.object({
  requirement: z.string().min(20).max(1000),
  framework: z.enum(['angular', 'react', 'html']),
  componentName: z.string().min(3).max(50),
  features: z.array(z.string()),
});

export async function POST(req: Request): Promise<Response> {
  try {
    if (!GROQ_API_KEY) {
      return Response.json(
        {
          error: 'Groq API key not configured',
          status: 500,
        } as APIErrorResponse,
        { status: 500 }
      );
    }

    const body = await req.json();
    const { requirement, framework, componentName, features } = RequestSchema.parse(body);

    // Build scoped prompt
    const systemPrompt = `You are ComponentForge, a specialized code generation agent.
You generate production-ready, reusable components for web applications.
Your responses are always valid, syntactically correct code without explanation.
You understand TypeScript, Angular, React, HTML/CSS/JavaScript deeply.
Output ONLY code, no markdown, no explanations.`;

    const userPrompt = getComponentPrompt(framework, requirement, componentName, features);

    // Call Groq LLM
    const message = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const generatedCode = message.choices?.[0]?.message?.content ?? '';

    if (!generatedCode) {
      return Response.json(
        {
          error: 'Failed to generate component code',
          status: 400,
        } as APIErrorResponse,
        { status: 400 }
      );
    }

    // Parse response into separate files
    const files = parseGeneratedCode(generatedCode, framework);

    if (Object.keys(files).length === 0) {
      return Response.json(
        {
          error: 'Failed to parse generated code into files',
          status: 400,
        } as APIErrorResponse,
        { status: 400 }
      );
    }

    const response: ComponentResponse = {
      success: true,
      componentName,
      framework,
      files,
      timestamp: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (error) {
    console.error('[ComponentForge] Error:', error);

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: 'Invalid request parameters',
          details: error.errors,
          status: 400,
        } as APIErrorResponse,
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return Response.json(
      {
        error: errorMessage,
        status: 500,
      } as APIErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * Parse generated code into separate files
 * Expects format like:
 * //filename.ts
 * [code]
 *
 * //filename.html
 * [code]
 */
function parseGeneratedCode(code: string, framework: string): Record<string, string> {
  const files: Record<string, string> = {};

  // Match patterns like "//filename.ext" followed by code
  const filePattern = /\/\/([\w.-]+)\s*\n([\s\S]*?)(?=\/\/|$)/g;

  let match;
  while ((match = filePattern.exec(code)) !== null) {
    const filename = match[1].trim();
    const fileContent = match[2].trim();

    if (filename && fileContent) {
      files[filename] = fileContent;
    }
  }

  // If no files found, try alternative parsing
  if (Object.keys(files).length === 0) {
    // Fallback: split by common framework patterns
    if (framework === 'angular') {
      const patterns = [
        { name: 'component.ts', regex: /\/\/\s*component\.ts\s*([\s\S]*?)(?=\/\/|$)/ },
        { name: 'component.html', regex: /\/\/\s*component\.html\s*([\s\S]*?)(?=\/\/|$)/ },
        { name: 'component.scss', regex: /\/\/\s*component\.scss\s*([\s\S]*?)(?=\/\/|$)/ },
      ];

      patterns.forEach((pattern) => {
        const match = code.match(pattern.regex);
        if (match && match[1]) {
          files[pattern.name] = match[1].trim();
        }
      });
    } else if (framework === 'react') {
      // Extract from code blocks
      const jsMatch = code.match(/\/\/\s*(\w+\.tsx?)\s*([\s\S]*?)(?=\/\/|$)/);
      if (jsMatch) {
        files[jsMatch[1]] = jsMatch[2].trim();
      }
    }

    // If still nothing, return the whole code as a single file
    if (Object.keys(files).length === 0) {
      const ext =
        framework === 'angular'
          ? 'component.ts'
          : framework === 'react'
            ? 'component.tsx'
            : 'index.html';
      files[ext] = code;
    }
  }

  return files;
}

export async function GET(): Promise<Response> {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
