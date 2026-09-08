import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';

interface DynamicPreviewProps {
  files: Record<string, string>;
  framework: 'react' | 'html';
  componentName: string;
  features?: string[];
  previewData?: Record<string, unknown>;
  onInvalid?: (reason: string) => void;
}

const isStyleFile = (filename: string) => /\.(css|scss|sass)$/i.test(filename);
const getStyles = (files: Record<string, string>) =>
  Object.entries(files)
    .filter(([filename]) => isStyleFile(filename))
    .map(([, content]) => content)
    .join('\n');

const getMockProps = (features: string[], previewData?: Record<string, unknown>) => {
  if (previewData && typeof previewData === 'object' && !Array.isArray(previewData)) {
    return previewData;
  }
  const props: Record<string, unknown> = {};
  if (features.includes('list') || features.includes('table')) {
    props.items = Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      label: `Item ${index + 1}`,
    }));
  }
  if (features.includes('dropdown') || features.includes('select')) {
    props.options = ['Option A', 'Option B', 'Option C'];
  }
  if (features.includes('button')) {
    props.onClick = () => window.alert('Action triggered');
    props.children = 'Action';
  }
  return props;
};

const selectPreviewFile = (files: Record<string, string>, framework: 'react' | 'html') => {
  const filenames = Object.keys(files);
  if (framework === 'react') return filenames.find((filename) => /\.(tsx|jsx)$/i.test(filename));
  return filenames.find((filename) => filename.endsWith('.html'));
};

const stripImports = (code: string) =>
  code
    .replace(
      /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"][^'"]+\.(?:module\.)?(?:css|scss|sass)['"];?/g,
      'const $1 = new Proxy({}, { get: (_, key) => key });'
    )
    .replace(/import\s+[^;]+from\s+['"][^'"]+['"];?/g, '')
    .replace(/import\s+['"][^'"]+['"];?/g, '');

const getScripts = (files: Record<string, string>, htmlFile: string) =>
  Object.entries(files)
    .filter(([filename]) => filename !== htmlFile && /\.js$/i.test(filename))
    .map(([, content]) => content)
    .join('\n');

export const DynamicPreview: React.FC<DynamicPreviewProps> = ({
  files,
  framework,
  componentName,
  features = [],
  previewData,
  onInvalid,
}) => {
  const rootRef = useRef<Root | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const previewFile = useMemo(() => selectPreviewFile(files, framework), [files, framework]);
  const previewProps = useMemo(() => getMockProps(features, previewData), [features, previewData]);

  useEffect(() => {
    if (!containerRef.current) return;
    rootRef.current?.unmount();
    rootRef.current = null;
    containerRef.current.replaceChildren();
    setRenderError(null);

    if (!previewFile) {
      const message = 'No entry file was generated for this preview.';
      setRenderError(message);
      onInvalid?.(message);
      return;
    }

    if (framework === 'html') {
      const frame = document.createElement('iframe');
      frame.title = 'Generated HTML component preview';
      frame.className = 'h-[420px] w-full border-0 bg-white';
      const data = JSON.stringify(previewProps).replace(/</g, '\\u003c');
      frame.srcdoc = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${getStyles(files)}</style></head><body>${files[previewFile]}<script>window.previewData=${data};</script><script>${getScripts(files, previewFile)}</script></body></html>`;
      frame.onerror = () => {
        const message = 'The generated HTML preview could not be loaded.';
        setRenderError(message);
        onInvalid?.(message);
      };
      containerRef.current.appendChild(frame);
      return;
    }

    const Babel = (
      window as typeof window & {
        Babel?: { transform: (source: string, options: object) => { code: string } };
      }
    ).Babel;
    if (!Babel) {
      const message = 'The preview compiler is not loaded yet.';
      setRenderError(message);
      onInvalid?.(message);
      return;
    }

    try {
      const transformed = Babel.transform(stripImports(files[previewFile]), {
        presets: [
          ['typescript', { ignoreExtensions: true }],
          ['react', { runtime: 'classic' }],
        ],
        plugins: ['syntax-jsx', 'transform-modules-commonjs'],
        sourceType: 'module',
      }).code;
      const module = { exports: {} as Record<string, unknown> };
      const hooks = 'useState,useEffect,useMemo,useCallback,useRef,memo,Fragment';
      const fn = new Function(
        'React',
        'exports',
        'module',
        `const {${hooks}} = React;${transformed}\nreturn module.exports;`
      );
      const exports = fn(React, module.exports, module) as Record<string, unknown>;
      const Component = resolveComponentExport(exports, componentName);
      if (!Component) {
        throw new Error('The entry file did not export a React component.');
      }

      const styleTag = document.createElement('style');
      styleTag.textContent = getStyles(files);
      containerRef.current.appendChild(styleTag);
      const mount = document.createElement('div');
      mount.className = 'min-h-[380px]';
      containerRef.current.appendChild(mount);
      rootRef.current = createRoot(mount);
      rootRef.current.render(React.createElement(Component as React.ElementType, previewProps));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'The generated component could not be compiled.';
      setRenderError(message);
      onInvalid?.(message);
    }

    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;
    };
  }, [componentName, files, framework, onInvalid, previewFile, previewProps]);

  return (
    <div className="preview-shell">
      <div className="preview-shell__header">Live Component Preview</div>
      <div ref={containerRef} className="preview-shell__body" />
      {renderError && <div className="preview-shell__error">Preview issue: {renderError}</div>}
    </div>
  );
};

export default DynamicPreview;

function resolveComponentExport(
  exports: Record<string, unknown>,
  componentName: string
): React.ElementType | null {
  const preferred = [exports.default, exports[componentName]];
  const namedExport = Object.entries(exports).find(
    ([name, value]) => name !== '__esModule' && typeof value === 'function'
  )?.[1];
  const isRenderableExport = (value: unknown) =>
    typeof value === 'function' ||
    (value &&
      typeof value === 'object' &&
      '$$typeof' in value &&
      ('type' in value || '_payload' in value));
  const candidate = preferred.find(isRenderableExport) ?? namedExport;
  return isRenderableExport(candidate) ? (candidate as React.ElementType) : null;
}
