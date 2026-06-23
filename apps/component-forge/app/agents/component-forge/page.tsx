'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Download, Copy, RefreshCw } from 'lucide-react';
import type { Framework, ComponentResponse, APIErrorResponse } from '@agent-studio/types';
import { CodePreview } from '@agent-studio/shared-ui';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function ComponentForgeAgent() {
  const [userInput, setUserInput] = useState('');
  const [framework, setFramework] = useState<Framework>('react');
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({});
  const [activeFileTab, setActiveFileTab] = useState<string>('');

  const mutation = useMutation({
    mutationFn: async (requirement: string) => {
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

      const res = await fetch('/api/generate-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement,
          framework,
          componentName: toPascalCase(componentName),
          features: features.length > 0 ? features : ['basic'],
        }),
      });

      if (!res.ok) {
        const error = (await res.json()) as APIErrorResponse;
        throw new Error(error.error || 'Failed to generate component');
      }

      return (await res.json()) as ComponentResponse;
    },
    onSuccess: (data) => {
      setGeneratedFiles(data.files);
      const firstFile = Object.keys(data.files)[0];
      setActiveFileTab(firstFile);
    },
  });

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
            placeholder="Example: Create a React TreeSelect component with multi-selection, group support, and filtering capabilities..."
            className="textarea-base"
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
                className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${
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
          onClick={() => mutation.mutate(userInput)}
          disabled={mutation.isPending || !userInput.trim()}
          className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Component'
          )}
        </button>

        {/* Error Display */}
        {mutation.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{mutation.error?.message}</p>
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
                className="btn-secondary py-2 px-3 flex items-center gap-2 text-sm"
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
      {Object.keys(generatedFiles).length === 0 && !mutation.isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3">💡 How to use ComponentForge:</h4>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>1. Describe what component you need (be specific about features)</li>
            <li>2. Select your target framework (Angular, React, or HTML)</li>
            <li>3. Click &quot;Generate Component&quot; and wait for the AI to create it</li>
            <li>4. Review the generated code and download in your preferred format</li>
            <li>5. Copy, paste, and integrate into your project</li>
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
