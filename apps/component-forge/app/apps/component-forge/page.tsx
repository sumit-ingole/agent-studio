import ComponentForgeAgent from '../../agents/component-forge/page';
import AuthGuard from '../../components/AuthGuard';

export const metadata = {
  title: 'Component Forge | Adio',
  description: 'Generate production-ready React and HTML components with AI.',
};

export default function ComponentForgeAppPage() {
  return (
    <AuthGuard>
      <div className="paper-grid min-h-screen py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Adio / live agent</span>
              <h1 className="mt-4 text-4xl text-strong sm:text-5xl">Component Forge</h1>
              <p className="mt-3 max-w-2xl text-muted">
                Describe the interface you need. Get reusable code, a live preview, and files ready
                to take with you.
              </p>
            </div>
            <a href="/" className="btn-secondary self-start text-sm sm:self-auto">
              Back to studio
            </a>
          </div>
          <div className="card bg-[var(--color-surface)] p-4 sm:p-7">
            <ComponentForgeAgent />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
