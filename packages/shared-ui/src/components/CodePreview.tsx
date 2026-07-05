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
    <div
      className={`rounded-lg border border-slate-700 flex flex-col overflow-hidden ${className}`}
      style={{ backgroundColor: '#0f172a' }}
    >
      <div
        className="px-4 py-2 text-xs font-mono flex-shrink-0"
        style={{ backgroundColor: '#1e293b', color: '#cbd5e1' }}
      >
        {language}
      </div>
      <pre
        className="p-4 overflow-y-auto flex-1 text-sm font-mono"
        style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
      >
        <code>
          {lines.map((line, idx) => (
            <div key={idx} className="flex">
              {showLineNumbers && (
                <span className="mr-4 text-right w-8 select-none" style={{ color: '#64748b' }}>
                  {idx + 1}
                </span>
              )}
              <span style={{ color: '#e2e8f0' }}>{line || '\u00A0'}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};
