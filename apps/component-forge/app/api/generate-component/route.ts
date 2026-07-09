import { existsSync, readFileSync } from 'fs';
import { join, resolve, parse } from 'path';
import { z } from 'zod';
import { getComponentPrompt } from '@agent-studio/ai-prompts';
import type { ComponentResponse } from '@agent-studio/types';

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

const RequestSchema = z.object({
  requirement: z.string().min(5).max(1000),
  framework: z.enum(['react', 'html']),
  componentName: z.string().min(3).max(50),
  features: z.array(z.string()).optional().default([]),
});

export async function POST(req: Request): Promise<Response> {
  const encoder = new TextEncoder();

  const sendMessage = (data: Record<string, unknown>) => {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    if (!GROQ_API_KEY) {
      return Response.json(
        {
          type: 'error',
          error: 'Groq API key not configured',
          message: 'Unable to process request: API key not found',
          status: 500,
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return Response.json(
        {
          type: 'error',
          error: 'Invalid request parameters',
          message: errors,
          status: 400,
        },
        { status: 400 }
      );
    }

    const { requirement, framework, componentName, features } = parseResult.data;

    // Return a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send processing message
          controller.enqueue(
            sendMessage({
              type: 'processing',
              message: 'Analyzing requirements...',
              timestamp: new Date().toISOString(),
            })
          );

          // Build scoped prompt
          const systemPrompt = `You are ComponentForge, a specialized code generation agent.
You generate production-ready, reusable components for web applications.
Your responses are always valid, syntactically correct code without explanation.
You understand TypeScript, React, HTML/CSS/JavaScript deeply.
Output ONLY code, no markdown, no explanations.`;

          const userPrompt = getComponentPrompt(framework, requirement, componentName, features);

          controller.enqueue(
            sendMessage({
              type: 'processing',
              message: `Generating ${componentName} component for ${framework}...`,
              timestamp: new Date().toISOString(),
            })
          );

          // Call Groq OpenAI-compatible chat endpoint directly. This avoids SDK request parsing issues.
          let generatedCode = '';
          const model = 'openai/gpt-oss-120b';
          const groqRequestBody = {
            model,
            max_tokens: 4096,
            temperature: 0.7,
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
          };

          const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(groqRequestBody),
          });

          const responseText = await groqResponse.text();
          let responseJson: any;

          try {
            responseJson = JSON.parse(responseText);
          } catch {
            responseJson = null;
          }

          if (!groqResponse.ok) {
            const details = responseJson ?? responseText;
            controller.enqueue(
              sendMessage({
                type: 'error',
                error: 'Groq API error',
                message: `Groq request failed with status ${groqResponse.status}`,
                details,
                status: groqResponse.status,
              })
            );
            controller.close();
            return;
          }

          generatedCode = responseJson?.choices?.[0]?.message?.content ?? '';

          if (!generatedCode) {
            controller.enqueue(
              sendMessage({
                type: 'error',
                error: 'Empty response',
                message: 'The AI model returned an empty or malformed response. Please try again.',
                details: responseJson ?? responseText,
                status: 400,
              })
            );
            controller.close();
            return;
          }

          controller.enqueue(
            sendMessage({
              type: 'processing',
              message: 'Parsing generated code into files...',
              timestamp: new Date().toISOString(),
            })
          );

          // Parse response into separate files
          const files = parseGeneratedCode(generatedCode, framework);

          if (Object.keys(files).length === 0) {
            controller.enqueue(
              sendMessage({
                type: 'error',
                error: 'Parsing failed',
                message:
                  'Failed to parse generated code into files. The response format might be unexpected.',
                details: { generatedCode: generatedCode.substring(0, 200) },
                status: 400,
              })
            );
            controller.close();
            return;
          }

          controller.enqueue(
            sendMessage({
              type: 'processing',
              message: `Successfully generated ${Object.keys(files).length} files`,
              timestamp: new Date().toISOString(),
            })
          );

          const response: ComponentResponse = {
            success: true,
            componentName,
            framework,
            files,
            timestamp: new Date().toISOString(),
          };

          controller.enqueue(
            sendMessage({
              type: 'success',
              data: response,
              timestamp: new Date().toISOString(),
            })
          );

          controller.close();
        } catch (error) {
          console.error('[ComponentForge] Stream Error:', error);

          const errorMessage = error instanceof Error ? error.message : 'Internal server error';
          controller.enqueue(
            sendMessage({
              type: 'error',
              error: 'Generation failed',
              message: errorMessage,
              status: 500,
            })
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[ComponentForge] Error:', error);

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          type: 'error',
          error: 'Invalid request',
          message: 'Invalid request parameters',
          details: error.errors,
          status: 400,
        },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return Response.json(
      {
        type: 'error',
        error: 'Server error',
        message: errorMessage,
        status: 500,
      },
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
    if (framework === 'react') {
      const jsMatch = code.match(/\/\/\s*(\w+\.tsx?)\s*([\s\S]*?)(?=\/\/|$)/);
      if (jsMatch) {
        files[jsMatch[1]] = jsMatch[2].trim();
      }
    }

    // If still nothing, return the whole code as a single file
    if (Object.keys(files).length === 0) {
      const ext = framework === 'react' ? 'component.tsx' : 'index.html';
      files[ext] = code;
    }
  }

  return files;
}

export async function GET(): Promise<Response> {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
