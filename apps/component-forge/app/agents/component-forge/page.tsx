'use client';

import { useState, useCallback, useRef } from 'react';
import { Download, Copy, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { Framework, ComponentResponse } from '@agent-studio/types';
import { CodePreview, DynamicPreview } from '@agent-studio/shared-ui';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface StreamMessage {
  type: 'processing' | 'success' | 'error';
  message?: string;
  data?: ComponentResponse;
  error?: string;
  status?: number;
  timestamp?: string;
}

interface Message {
  type: 'processing' | 'success' | 'error';
  content: string;
  timestamp: string;
}

export default function ComponentForgeAgent() {
  const [userInput, setUserInput] = useState('');
  const [framework, setFramework] = useState<Framework>('react');
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({});
  const [activeFileTab, setActiveFileTab] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [previewComponentName, setPreviewComponentName] = useState('CustomComponent');
  const [previewFeatures, setPreviewFeatures] = useState<string[]>(['basic']);
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);

  const MIN_PROMPT_LENGTH = 20;
  const trimmedInput = userInput.trim();
  const isPromptValid = trimmedInput.length >= MIN_PROMPT_LENGTH;

  const mapApiError = (error?: string, status?: number, message?: string) => {
    if (status === 429) {
      return 'The AI service is temporarily busy. Please try again in a moment.';
    }
    if (status && status >= 500) {
      return 'The AI service is temporarily unavailable. Please try again later.';
    }
    if (error === 'Groq API error') {
      return message || 'The AI service returned an unexpected error. Please try again later.';
    }
    return message || error || 'Unable to generate component. Please try again.';
  };

  const handleGenerate = useCallback(
    async (requirement: string) => {
      if (!requirement.trim()) return;

      retryCountRef.current = 0;
      setValidationError(null);
      setIsLoading(true);
      setError(null);
      setMessages([]);
      setGeneratedFiles({});
      setActiveFileTab('');
      setPreviewData(null);

      try {
        // Simple requirement parser
        const nameMatch = requirement.match(
          /(?:create|build|generate|make|an?)\s+(?:a|an)?\s*(?:component\s+)?(?:called\s+)?(?:named\s+)?([\w]+)/i
        );
        const componentName = nameMatch ? nameMatch[1] : 'CustomComponent';

        const featureKeywords = [
          'dropdown',
          'select',
          'tree',
          'modal',
          'form',
          'table',
          'list',
          'button',
          'input',
          'checkbox',
          'radio',
          'toggle',
          'pagination',
          'sorting',
          'filtering',
          'search',
          'validation',
          'lazy-load',
        ];
        const features = featureKeywords.filter((f) => requirement.toLowerCase().includes(f));

        const componentNamePascal = toPascalCase(componentName);
        setPreviewComponentName(componentNamePascal);
        setPreviewFeatures(features.length > 0 ? features : ['basic']);

        const requestBody = {
          requirement,
          framework,
          componentName: componentNamePascal,
          features: features.length > 0 ? features : ['basic'],
        };

        const res = await fetch('/api/generate-component', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(120000), // 2 minute timeout
        });

        if (!res.ok) {
          let errorMessage = `Server error (${res.status})`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // Use default error message
          }
          throw new Error(errorMessage);
        }

        if (!res.body) {
          throw new Error('No response body received from server');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let lines = buffer.split('\n');
            buffer = lines[lines.length - 1];

            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i];
              if (line.startsWith('data: ')) {
                try {
                  const message: StreamMessage = JSON.parse(line.slice(6));

                  const timestamp = new Date().toLocaleTimeString();

                  if (message.type === 'processing') {
                    const processMessage: Message = {
                      type: 'processing',
                      content: message.message || 'Processing...',
                      timestamp,
                    };
                    setMessages((prev) => [...prev, processMessage]);
                  } else if (message.type === 'success' && message.data) {
                    let files = Object.fromEntries(
                      Object.entries(message.data.files).map(([name, content]) => [
                        name,
                        content.trim(),
                      ])
                    );
                    // Rename files based on component name
                    files = renameFilesForComponent(files, componentNamePascal);
                    const fileNames = Object.keys(files);
                    const firstFile = fileNames.length > 0 ? fileNames[0] : '';
                    setGeneratedFiles(files);
                    setActiveFileTab(firstFile);
                    setPreviewData(extractPreviewData(files));

                    const successMessage: Message = {
                      type: 'success',
                      content: `✓ Component generated successfully with ${fileNames.length} files`,
                      timestamp,
                    };
                    setMessages((prev) => [...prev, successMessage]);
                  } else if (message.type === 'error') {
                    const errorMsg = mapApiError(message.error, message.status, message.message);
                    setError(errorMsg);

                    const errorMessage: Message = {
                      type: 'error',
                      content: `✗ ${errorMsg}`,
                      timestamp,
                    };
                    setMessages((prev) => [...prev, errorMessage]);
                  }
                } catch (parseError) {
                  console.error('Failed to parse stream message:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (err) {
        const errorMessageRaw = err instanceof Error ? err.message : 'Failed to generate component';
        const errorMessage = mapApiError(undefined, undefined, errorMessageRaw);
        setError(errorMessage);
        setMessages((prev) => [
          ...prev,
          {
            type: 'error',
            content: `✗ ${errorMessage}`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [framework]
  );

  const handleRetry = () => {
    retryCountRef.current = 0;
    handleGenerate(userInput);
  };

  const downloadAsZip = async () => {
    const zip = new JSZip();
    Object.entries(generatedFiles).forEach(([filename, content]) => {
      zip.file(filename, content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'component.zip');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-muted mb-2">
              Describe Your Component
            </label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isLoading}
              placeholder="Example: Create a React TreeSelect component with multi-selection, group support, and filtering capabilities..."
              className="textarea-base disabled:opacity-50"
              rows={4}
            />
          </div>

          {/* Framework Selector */}
          <div>
            <label className="block text-sm font-semibold text-muted mb-3">Framework</label>
            <div className="flex gap-3">
              {(['react', 'html'] as const).map((fw) => (
                <button
                  key={fw}
                  onClick={() => setFramework(fw)}
                  disabled={isLoading}
                  className={`px-3 py-2 rounded-lg font-semibold capitalize transition-colors disabled:opacity-50 ${
                    framework === fw ? 'btn-primary' : 'panel-bg text-muted hover:opacity-90'
                  }`}
                >
                  {fw}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleGenerate(userInput)}
              disabled={isLoading || !isPromptValid}
              className="btn-primary py-2 text-base flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Component'
              )}
            </button>

            <button
              onClick={() => {
                setUserInput('');
                setGeneratedFiles({});
                setActiveFileTab('');
                setPreviewData(null);
              }}
              className="btn-ghost px-3 py-2"
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
          {!isPromptValid && (
            <p className="text-sm text-muted mt-2">
              Please enter at least {MIN_PROMPT_LENGTH} characters describing the component.
            </p>
          )}

          {/* Processing Messages Stream */}
          {messages.length > 0 && (
            <div className="p-4 panel-bg panel-border rounded-lg space-y-3 max-h-48 overflow-y-auto">
              <div className="text-sm font-semibold text-strong flex items-center gap-2">
                <Clock size={16} /> Processing Status
              </div>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 items-start text-sm p-2 rounded ${
                    msg.type === 'success'
                      ? 'status-pill text-success'
                      : msg.type === 'error'
                        ? 'status-pill text-error'
                        : 'status-pill text-primary'
                  }`}
                >
                  {msg.type === 'processing' && (
                    <Clock size={16} className="flex-shrink-0 mt-0.5" />
                  )}
                  {msg.type === 'success' && (
                    <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-success" />
                  )}
                  {msg.type === 'error' && (
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-error" />
                  )}
                  <div className="flex-grow">
                    <div>{msg.content}</div>
                    <div className="text-xs opacity-70">{msg.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Display with Retry */}
          {validationError && (
            <div className="p-4 panel-bg panel-border rounded-lg">
              <p className="text-error text-sm font-medium">{validationError}</p>
            </div>
          )}
          {error && (
            <div className="p-4 panel-bg panel-border rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-error flex-shrink-0 mt-0.5" />
                <div className="flex-grow">
                  <p className="text-error text-sm font-medium">{error}</p>
                  <button
                    onClick={handleRetry}
                    disabled={isLoading}
                    className="mt-2 text-sm px-3 py-1 btn-primary disabled:opacity-50"
                  >
                    Retry Generation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Output Section */}
        {Object.keys(generatedFiles).length > 0 && (
          <div className="space-y-4 surface rounded-3xl panel-border shadow-sm p-6 overflow-hidden">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-strong">Generated Files</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generatedFiles[activeFileTab])}
                  disabled={!activeFileTab}
                  className="btn-secondary py-2 px-3 flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  <Copy size={16} /> Copy
                </button>
                <button
                  onClick={downloadAsZip}
                  className="btn-primary py-2 px-3 flex items-center gap-2 text-sm"
                >
                  <Download size={16} /> Download ZIP
                </button>
              </div>
            </div>

            <div className="rounded-2xl panel-border panel-bg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-strong">Feature Preview</h4>
                  <p className="text-sm text-muted">
                    The generated component is rendered here with live sample data so you can
                    inspect the experience instantly.
                  </p>
                </div>
                <span className="rounded-full status-pill text-primary">Live demo</span>
              </div>

              <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-4">
                <DynamicPreview
                  files={generatedFiles}
                  framework={framework}
                  componentName={previewComponentName}
                  features={previewFeatures}
                  previewData={previewData ?? undefined}
                />
                <div className="rounded-xl panel-border surface p-4">
                  <div className="text-sm font-semibold text-strong mb-3">Sample Data</div>
                  {previewData ? (
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs text-muted">
                      {JSON.stringify(previewData, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-sm text-muted">
                      No sample data was generated for this component yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <div className="lg:col-span-1">
                <div className="p-4 surface rounded-lg panel-border">
                  <h4 className="font-semibold text-strong mb-2">Attributes & Interfaces</h4>
                  <AttributesList files={generatedFiles} />
                </div>
              </div>

              <div className="lg:col-span-2">
                {/* File Tabs */}
                <div className="flex gap-2 border-b panel-border overflow-x-auto">
                  {Object.keys(generatedFiles).map((filename) => (
                    <button
                      key={filename}
                      onClick={() => setActiveFileTab(filename)}
                      className={`px-4 py-2 font-mono text-sm border-b-2 transition-colors whitespace-nowrap ${
                        activeFileTab === filename
                          ? 'tab-button-active'
                          : 'border-transparent tab-button hover:text-strong'
                      }`}
                    >
                      {filename}
                    </button>
                  ))}
                </div>

                {/* Code Preview */}
                {activeFileTab && (
                  <CodePreview
                    code={generatedFiles[activeFileTab]}
                    language={detectLanguage(activeFileTab)}
                    showLineNumbers
                    className="max-h-96 mt-4"
                  />
                )}
              </div>
            </div>

            {/* File List */}
            <div className="mt-6">
              <h4 className="font-semibold text-strong mb-3">All Generated Files:</h4>
              <div className="space-y-2">
                {Object.keys(generatedFiles).map((filename) => (
                  <div
                    key={filename}
                    className="flex items-center justify-between p-3 panel-bg rounded-lg panel-border"
                  >
                    <span className="font-mono text-sm text-muted">{filename}</span>
                    <span className="text-xs text-muted">
                      {Math.round(generatedFiles[filename].length / 1024)} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        {Object.keys(generatedFiles).length === 0 && !isLoading && (
          <div className="panel-bg panel-border rounded-lg p-6">
            <h4 className="font-semibold text-strong mb-3">💡 How to use ComponentForge:</h4>
            <ul className="space-y-2 text-muted text-sm">
              <li>1. Describe what component you need (be specific about features)</li>
              <li>2. Select your target framework (React or HTML)</li>
              <li>3. Click &quot;Generate Component&quot; and watch the progress</li>
              <li>4. See real-time processing status as the AI generates your component</li>
              <li>5. Review the generated code and download in your preferred format</li>
              <li>6. Copy, paste, and integrate into your project</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function detectLanguage(filename: string): 'typescript' | 'html' | 'scss' | 'css' | 'javascript' {
  if (filename.includes('.ts')) return 'typescript';
  if (filename.includes('.html')) return 'html';
  if (filename.includes('.scss')) return 'scss';
  if (filename.includes('.css')) return 'css';
  return 'javascript';
}

function extractPreviewData(files: Record<string, string>): Record<string, unknown> | null {
  const previewFile = Object.entries(files).find(
    ([filename]) => filename.toLowerCase() === 'preview-data.json'
  );
  if (!previewFile) return null;

  try {
    const parsed = JSON.parse(previewFile[1]);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function toPascalCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase());
}

function renameFilesForComponent(
  files: Record<string, string>,
  componentName: string
): Record<string, string> {
  const renamed: Record<string, string> = {};

  Object.entries(files).forEach(([filename, content]) => {
    let newFilename = filename;

    // Check if filename is a generic name
    if (filename.match(/^(component|index|main)\.(tsx?|jsx?)$/i)) {
      // Replace generic component name with actual component name
      const ext = filename.split('.').pop() || 'tsx';
      newFilename = `${componentName}.${ext}`;
    } else if (filename.match(/^(styles?|theme|styles?\.module)\.(css|scss|sass)$/i)) {
      // Rename style files
      const ext = filename.split('.').pop() || 'css';
      newFilename = `${componentName}.${ext}`;
    } else if (filename.match(/^(test|spec|\w*\.test|\w*\.spec)\.(tsx?|jsx?)$/i)) {
      // Rename test files
      const ext = filename.split('.').pop() || 'tsx';
      newFilename = `${componentName}.test.${ext}`;
    } else if (filename.match(/^types?\.(tsx?|d\.ts)$/i)) {
      // Rename type files
      const ext = filename.includes('.d.ts') ? 'd.ts' : 'ts';
      newFilename = `${componentName}.types.${ext}`;
    } else if (filename.match(/^(README|readme|CHANGELOG|changelog)\.(md|txt)$/i)) {
      // Keep documentation files as is, but update if they reference component name
      newFilename = filename;
    } else if (filename.match(/^interface|props|const|utils|helpers\.(tsx?|jsx?)$/i)) {
      // Keep utility and interface files with their names
      newFilename = filename;
    }

    renamed[newFilename] = content;
  });

  return renamed;
}

function parseAttributesFromFiles(files: Record<string, string>): {
  interfaces: string[];
  props: string[];
} {
  const interfaces = new Set<string>();
  const props = new Set<string>();

  Object.values(files).forEach((content) => {
    // simple interface capture
    const ifaceRe = /interface\s+([A-Za-z0-9_]+)/g;
    let m;
    while ((m = ifaceRe.exec(content)) !== null) {
      interfaces.add(m[1]);
    }

    // simple props capture (propName: type)
    const propRe = /([A-Za-z0-9_]+)\s*:\s*[A-Za-z0-9_<>\[\]{}|]+/g;
    while ((m = propRe.exec(content)) !== null) {
      props.add(m[1]);
    }
  });

  return { interfaces: Array.from(interfaces), props: Array.from(props) };
}

function AttributesList({ files }: { files: Record<string, string> }) {
  const { interfaces, props } = parseAttributesFromFiles(files);

  return (
    <div>
      {interfaces.length === 0 && props.length === 0 && (
        <div className="text-sm text-muted">No explicit interfaces or props detected.</div>
      )}

      {interfaces.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-muted mb-1">Interfaces</div>
          <div className="space-y-1">
            {interfaces.map((i) => (
              <div key={i} className="text-sm text-muted">
                {i}
              </div>
            ))}
          </div>
        </div>
      )}

      {props.length > 0 && (
        <div>
          <div className="text-xs text-muted mb-1">Attributes / Props</div>
          <div className="space-y-1">
            {props.map((p) => (
              <div key={p} className="text-sm text-muted">
                {p}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
