import { existsSync, readFileSync } from 'fs';
import { join, resolve, parse } from 'path';
import { z } from 'zod';
import { getComponentPrompt } from '@agent-studio/ai-prompts';
import type { ComponentResponse } from '@agent-studio/types';

const MAX_GENERATION_ATTEMPTS = 3;
const REACT_EXTENSIONS = /\.(tsx|jsx|css|scss|json)$/i;
const HTML_EXTENSIONS = /\.(html|js|css|json)$/i;
const GENERIC_GENERATION_ERROR =
  'We could not create a working component from that request. Please adjust the component description and try again.';
type ValidationResult = { valid: true } | { valid: false; errors: string[] };

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
Output ONLY the standard source files requested by the user prompt, with no markdown or explanations.`;

          const userPrompt = getComponentPrompt(framework, requirement, componentName, features);

          controller.enqueue(
            sendMessage({
              type: 'processing',
              message: `Generating ${componentName} component for ${framework}...`,
              timestamp: new Date().toISOString(),
            })
          );

          const model = 'openai/gpt-oss-120b';
          let files: Record<string, string> = {};
          let validation: ValidationResult = { valid: false, errors: ['No generation attempted'] };
          let correction = '';

          for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
            controller.enqueue(
              sendMessage({
                type: 'processing',
                message:
                  attempt === 1
                    ? 'Generating component files...'
                    : `Repairing generated files (attempt ${attempt}/${MAX_GENERATION_ATTEMPTS})...`,
                timestamp: new Date().toISOString(),
              })
            );

            let groqResponse: Response;
            try {
              groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${GROQ_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model,
                  max_tokens: 4096,
                  temperature: attempt === 1 ? 0.45 : 0.2,
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `${userPrompt}${correction}` },
                  ],
                }),
              });
            } catch {
              correction =
                '\n\nThe previous generation attempt could not reach the generation service. Return the complete standard source-file output again.';
              controller.enqueue(
                sendMessage({
                  type: 'processing',
                  message: 'The generation service is unavailable. Retrying...',
                  timestamp: new Date().toISOString(),
                })
              );
              continue;
            }

            const responseText = await groqResponse.text();
            let responseJson: any;
            try {
              responseJson = JSON.parse(responseText);
            } catch {
              responseJson = null;
            }

            if (!groqResponse.ok) {
              correction =
                '\n\nThe previous generation attempt was unavailable. Return the complete standard source-file output again.';
              controller.enqueue(
                sendMessage({
                  type: 'processing',
                  message: 'The generation service did not return a usable result. Retrying...',
                  timestamp: new Date().toISOString(),
                })
              );
              continue;
            }

            const generatedCode = responseJson?.choices?.[0]?.message?.content ?? '';
            if (!generatedCode.trim()) {
              correction =
                '\n\nThe previous generation was empty. Return every required source file again.';
              continue;
            }
            files = parseGeneratedCode(generatedCode, framework);
            validation = validateGeneratedFiles(files, framework);
            if (validation.valid) break;

            correction = `\n\nYour previous source-file output was invalid. Return the complete source-file output again and correct these internal checks: ${validation.errors.join('; ')}.`;
            controller.enqueue(
              sendMessage({
                type: 'processing',
                message: 'The generated files need a correction. Retrying...',
                timestamp: new Date().toISOString(),
              })
            );
          }

          if (!validation.valid) {
            controller.enqueue(
              sendMessage({
                type: 'error',
                error: 'Generation failed',
                message: GENERIC_GENERATION_ERROR,
                status: 422,
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

          const errorMessage = GENERIC_GENERATION_ERROR;
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

  const blockPattern = /===\s*FILE:\s*([^=\n]+?)\s*===\s*\n([\s\S]*?)\n===\s*END FILE\s*===/gi;
  let blockMatch;
  while ((blockMatch = blockPattern.exec(code)) !== null) {
    const filename = blockMatch[1].trim();
    const content = blockMatch[2].trim();
    if (filename && content) files[filename] = content;
  }
  if (Object.keys(files).length > 0) return files;

  const filePattern =
    /\/\/\s*(?:FILE:\s*)?([\w.-]+)\s*\n([\s\S]*?)(?=\/\/\s*(?:FILE:\s*)?[\w.-]+\s*\n|$)/g;

  let match;
  while ((match = filePattern.exec(code)) !== null) {
    const filename = match[1].trim();
    const fileContent = match[2].trim();

    if (filename && fileContent) {
      files[filename] = fileContent;
    }
  }

  if (Object.keys(files).length === 0) {
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

function validateGeneratedFiles(
  files: Record<string, string>,
  framework: 'react' | 'html'
): ValidationResult {
  const errors: string[] = [];
  const extensionPattern = framework === 'react' ? REACT_EXTENSIONS : HTML_EXTENSIONS;
  const filenames = Object.keys(files);

  if (filenames.length === 0) errors.push('no files were returned');
  const previewFilename = filenames.find(
    (filename) => filename.toLowerCase() === 'preview-data.json'
  );
  if (!previewFilename) {
    errors.push('preview-data.json is mandatory');
  } else {
    try {
      const previewData = JSON.parse(files[previewFilename]);
      if (!previewData || typeof previewData !== 'object' || Array.isArray(previewData)) {
        errors.push('preview-data.json must contain an object');
      }
    } catch {
      errors.push('preview-data.json is not valid JSON');
    }
  }

  filenames.forEach((filename) => {
    const content = files[filename]?.trim();
    if (!extensionPattern.test(filename)) errors.push(`${filename} has an unsupported extension`);
    if (!content) errors.push(`${filename} is empty`);
    if (filename.match(/\.(tsx|jsx|js)$/i) && !/[{}]/.test(content)) {
      errors.push(`${filename} does not contain a valid code body`);
    }
    if (filename.match(/\.(tsx|jsx|js)$/i) && /```/.test(content)) {
      errors.push(`${filename} contains markdown fences instead of source code`);
    }
  });

  const componentFile = filenames.find((filename) => /\.(tsx|jsx)$/i.test(filename));
  if (framework === 'react' && !componentFile) {
    errors.push('a .tsx or .jsx component file is required');
  } else if (framework === 'react' && componentFile) {
    const componentSource = files[componentFile];
    if (!/export\s+default\s+/.test(componentSource)) {
      errors.push('the React component must have a default export');
    }
    if (!/return\s*\(|=>\s*\(?\s*</.test(componentSource)) {
      errors.push('the React file does not contain a renderable component body');
    }
  }
  if (framework === 'html' && !filenames.some((filename) => filename.endsWith('.html'))) {
    errors.push('an .html entry file is required');
  }
  if (framework === 'html' && !filenames.some((filename) => filename.endsWith('.js'))) {
    errors.push('a JavaScript behavior file is required');
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

export async function GET(): Promise<Response> {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
