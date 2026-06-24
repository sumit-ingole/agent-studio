import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';

interface DynamicPreviewProps {
  files: Record<string, string>;
  framework: 'react' | 'html';
  componentName: string;
  features?: string[];
  onInvalid?: (reason: string) => void;
}

const stripCssImports = (code: string) =>
  code.replace(/import\s+['"][^'"]+\.(module\.)?(css|scss|sass)['"];?/g, '');

const selectPreviewFile = (files: Record<string, string>, framework: string) => {
  const ordered = Object.keys(files).sort((a, b) => a.length - b.length);
  if (framework === 'react') {
    return ordered.find((name) => /\.tsx?$/.test(name));
  }
  if (framework === 'html') {
    return ordered.find((name) => name.endsWith('.html')) || ordered[0];
  }
  return ordered[0];
};

const getMockProps = (features: string[]) => {
  const props: Record<string, unknown> = {};
  if (features.includes('list') || features.includes('table')) {
    props.items = Array.from({ length: 5 }).map((_, i) => ({ id: i + 1, label: `Item ${i + 1}` }));
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

export const DynamicPreview: React.FC<DynamicPreviewProps> = ({
  files,
  framework,
  componentName,
  features = [],
  onInvalid,
}) => {
  const rootRef = useRef<Root | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const previewFile = useMemo(() => selectPreviewFile(files, framework), [files, framework]);
  const previewCode = useMemo(
    () => (previewFile ? files[previewFile].trim() : ''),
    [files, previewFile]
  );
  const mockProps = useMemo(() => getMockProps(features), [features]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (rootRef.current) {
      rootRef.current.unmount();
      rootRef.current = null;
    }
    setRenderError(null);

    if (!previewFile) {
      containerRef.current.innerHTML =
        '<div class="text-sm text-slate-600">No preview file available.</div>';
      return;
    }

    if (framework === 'html') {
      containerRef.current.innerHTML = previewCode;
      return;
    }

    if (framework !== 'react') {
      containerRef.current.innerHTML =
        '<div class="text-sm text-slate-600">Preview is only available for React components.</div>';
      return;
    }

    const Babel = (window as any).Babel;
    if (!Babel) {
      const msg = 'Babel is not loaded yet. Reload the page.';
      setRenderError(msg);
      onInvalid?.(msg);
      return;
    }

    const source = stripCssImports(previewCode);
    let transformed: string;
    try {
      transformed = Babel.transform(source, {
        presets: [
          ['typescript', { allExtensions: true }],
          ['react', { runtime: 'automatic' }],
        ],
        plugins: ['transform-modules-commonjs'],
        sourceType: 'module',
      }).code;
    } catch (err: any) {
      const message = err?.message || 'Syntax error';
      setRenderError(message);
      onInvalid?.(message);
      return;
    }

    try {
      const module = { exports: {} as any };
      const require = () => ({});
      const fn = new Function(
        'React',
        'exports',
        'module',
        'require',
        `${transformed}
return module.exports;`
      );
      const moduleExports = fn(React, module.exports, module, require);
      const Component = moduleExports.default || moduleExports[componentName] || moduleExports;
      if (!Component || typeof Component !== 'function') {
        const msg = 'Rendered file did not export a valid component.';
        setRenderError(msg);
        onInvalid?.(msg);
        return;
      }
      rootRef.current = createRoot(containerRef.current);
      rootRef.current.render(React.createElement(Component, mockProps));
    } catch (err: any) {
      const message = err?.message || 'Render error';
      setRenderError(message);
      onInvalid?.(message);
      return;
    }
  }, [framework, mockProps, onInvalid, previewCode, previewFile, componentName]);

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
      <div className="bg-slate-100 px-3 py-2 text-xs text-slate-600 font-medium">
        Live Component Preview
      </div>
      <div ref={containerRef} className="min-h-[420px] p-4"></div>
      {renderError && (
        <div className="border-t border-slate-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Preview issue: {renderError}
        </div>
      )}
    </div>
  );
};

export default DynamicPreview;
