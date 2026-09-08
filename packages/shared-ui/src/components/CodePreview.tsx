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
    <div className={`code-preview flex flex-col overflow-hidden ${className}`}>
      <div className="code-preview__header px-4 py-2 text-xs font-mono flex-shrink-0">
        {language}
      </div>
      <pre className="code-preview__body p-4 overflow-y-auto flex-1 text-sm font-mono">
        <code>
          {lines.map((line, idx) => (
            <div key={idx} className="flex">
              {showLineNumbers && (
                <span className="code-preview__line-number mr-4 text-right w-8 select-none">
                  {idx + 1}
                </span>
              )}
              <span>{line || '\u00A0'}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};
