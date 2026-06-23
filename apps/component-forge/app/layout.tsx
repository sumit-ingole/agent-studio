import type { Metadata } from 'next';
import './globals.css';
import { ReactQueryProvider } from './providers';

export const metadata: Metadata = {
  title: 'ComponentForge - AI Component Generation',
  description:
    'Generate production-ready reusable components for Angular, React, and HTML with AI-powered ComponentForge agent.',
  keywords: ['AI', 'Component Generation', 'Angular', 'React', 'TypeScript'],
  authors: [{ name: 'Sumit Ingole' }],
  viewport: 'width=device-width, initial-scale=1.0',
  robots: 'index, follow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-slate-50">
        <div className="min-h-screen flex flex-col">
          {/* Navigation Header */}
          <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-blue-600">⚙️</div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">AgentStudio</h1>
                    <p className="text-xs text-slate-500">ComponentForge</p>
                  </div>
                </div>
                <nav className="hidden sm:flex items-center gap-6">
                  <a
                    href="/"
                    className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    Home
                  </a>
                  <a
                    href="https://github.com/sumit-ingole/agent-studio"
                    className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            <ReactQueryProvider>{children}</ReactQueryProvider>
          </main>

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-300 py-8 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm">© 2024 AgentStudio. Built with Next.js, React, and AI.</p>
                <div className="flex gap-4 text-sm">
                  <a href="/" className="hover:text-slate-100 transition-colors">
                    Home
                  </a>
                  <a
                    href="https://github.com/sumit-ingole"
                    className="hover:text-slate-100 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Author
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
