'use client';

import { useState, useCallback } from 'react';
import { Download, Copy, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { Framework, ComponentResponse } from '@agent-studio/types';
import { CodePreview } from '@agent-studio/shared-ui';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface StreamMessage {
  type: 'processing' | 'success' | 'error';
  message?: string;
  data?: ComponentResponse;
  error?: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const MIN_PROMPT_LENGTH = 20;
  const trimmedInput = userInput.trim();
  const isPromptValid = trimmedInput.length >= MIN_PROMPT_LENGTH;

  const handleGenerate = useCallback(
    async (requirement: string) => {
      if (!requirement.trim()) return;

      setIsLoading(true);
      setError(null);
      setMessages([]);
      setGeneratedFiles({});
      setActiveFileTab('');

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

        const requestBody = {
          requirement,
          framework,
          componentName: toPascalCase(componentName),
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
            const lines = buffer.split('\n');
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
                    setGeneratedFiles(message.data.files);
                    const firstFile = Object.keys(message.data.files)[0];
                    setActiveFileTab(firstFile);

                    const successMessage: Message = {
                      type: 'success',
                      content: `✓ Component generated successfully with ${Object.keys(message.data.files).length} files`,
                      timestamp,
                    };
                    setMessages((prev) => [...prev, successMessage]);
                  } else if (message.type === 'error') {
                    const errorMsg = message.message || message.error || 'Unknown error occurred';
                    setError(errorMsg);

                    const errorMessage: Message = {
                      type: 'error',
                      content: `✗ Error: ${errorMsg}`,
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate component';
        setError(errorMessage);
        setMessages((prev) => [
          ...prev,
          {
            type: 'error',
            content: `✗ Error: ${errorMessage}`,
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
    <div className="space-y-8">
      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
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
          <label className="block text-sm font-semibold text-slate-700 mb-3">Framework</label>
          <div className="flex gap-3">
            {(['angular', 'react', 'html'] as const).map((fw) => (
              <button
                key={fw}
                onClick={() => setFramework(fw)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors disabled:opacity-50 ${
                  framework === fw
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {fw}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={() => handleGenerate(userInput)}
          disabled={isLoading || !isPromptValid}
          className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2 disabled:opacity-60"
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
        {!isPromptValid && (
          <p className="text-sm text-slate-600 mt-2">
            Please enter at least {MIN_PROMPT_LENGTH} characters describing the component.
          </p>
        )}

        {/* Processing Messages Stream */}
        {messages.length > 0 && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 max-h-48 overflow-y-auto">
            <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock size={16} /> Processing Status
            </div>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 items-start text-sm p-2 rounded ${
                  msg.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : msg.type === 'error'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-blue-50 text-blue-700'
                }`}
              >
                {msg.type === 'processing' && <Clock size={16} className="flex-shrink-0 mt-0.5" />}
                {msg.type === 'success' && (
                  <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-green-600" />
                )}
                {msg.type === 'error' && (
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
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
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-grow">
                <p className="text-red-700 text-sm font-medium">{error}</p>
                <button
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="mt-2 text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Generated Files</h3>
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

          {/* File Tabs */}
          <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
            {Object.keys(generatedFiles).map((filename) => (
              <button
                key={filename}
                onClick={() => setActiveFileTab(filename)}
                className={`px-4 py-2 font-mono text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeFileTab === filename
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
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
              className="max-h-96"
            />
          )}

          {/* File List */}
          <div className="mt-6">
            <h4 className="font-semibold text-slate-900 mb-3">All Generated Files:</h4>
            <div className="space-y-2">
              {Object.keys(generatedFiles).map((filename) => (
                <div
                  key={filename}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <span className="font-mono text-sm text-slate-700">{filename}</span>
                  <span className="text-xs text-slate-500">
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3">💡 How to use ComponentForge:</h4>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>1. Describe what component you need (be specific about features)</li>
            <li>2. Select your target framework (Angular, React, or HTML)</li>
            <li>3. Click &quot;Generate Component&quot; and watch the progress</li>
            <li>4. See real-time processing status as the AI generates your component</li>
            <li>5. Review the generated code and download in your preferred format</li>
            <li>6. Copy, paste, and integrate into your project</li>
          </ul>
        </div>
      )}
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

function toPascalCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase());
}
