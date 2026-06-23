import React from 'react';

interface CodePreviewProps {
  code: string;
  language?: 'typescript' | 'html' | 'scss' | 'css' | 'javascript';
  showLineNumbers?: boolean;
  className?: string;
}

/**
 * CodePreview - Syntax-highlighted code display
 */
export const CodePreview: React.FC<CodePreviewProps> = ({
  code,
  language = 'typescript',
  showLineNumbers = true,
  className = '',
}) => {
  const lines = code.split('\n');

  return (
    <div className={`rounded-lg bg-slate-900 overflow-hidden ${className}`}>
      <div className="bg-slate-800 px-4 py-2 text-xs text-slate-400 font-mono">
        {language}
      </div>
      <pre className="p-4 overflow-auto text-sm text-slate-100">
        <code>
          {lines.map((line, idx) => (
            <div key={idx} className="flex">
              {showLineNumbers && (
                <span className="text-slate-600 mr-4 text-right w-8 select-none">{idx + 1}</span>
              )}
              <span>{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};
