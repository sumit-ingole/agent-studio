import type { Metadata } from 'next';
import './globals.css';
import { ReactQueryProvider } from './providers';
import dynamic from 'next/dynamic';
import Script from 'next/script';

const ThemeToggle = dynamic(() => import('./components/ThemeToggle'), { ssr: false });

export const metadata: Metadata = {
  title: 'ComponentForge - AI Component Generation',
  description:
    'Generate production-ready reusable components for React and HTML with AI-powered ComponentForge agent.',
  keywords: ['AI', 'Component Generation', 'React', 'HTML', 'TypeScript'],
  authors: [{ name: 'Sumit Ingole' }],
  viewport: 'width=device-width, initial-scale=1.0',
  robots: 'index, follow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="transition-colors duration-200">
        <div className="min-h-screen flex flex-col">
          {/* Navigation Header */}
          <header className="sticky top-0 z-50 header-bg border-b panel-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-primary">⚙️</div>
                  <div>
                    <h1 className="text-xl font-bold text-strong">AgentStudio</h1>
                    <p className="text-xs text-muted">ComponentForge</p>
                  </div>
                </div>
                <nav className="hidden sm:flex items-center gap-6">
                  <a href="/" className="nav-link font-medium">
                    Home
                  </a>
                  <a
                    href="https://github.com/sumit-ingole/agent-studio"
                    className="nav-link font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </nav>
                <div className="ml-4">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>
          <Script
            src="https://unpkg.com/@babel/standalone/babel.min.js"
            strategy="beforeInteractive"
          />

          {/* Main Content */}
          <main className="flex-1">
            <ReactQueryProvider>{children}</ReactQueryProvider>
          </main>

          {/* Footer */}
          <footer className="panel-bg text-muted py-8 border-t panel-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm">
                  © {currentYear} AgentStudio. Built with Next.js, React, and AI.
                </p>
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
