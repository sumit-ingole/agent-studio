'use client';

import Link from 'next/link';
import { ArrowRight, Zap, GitBranch, Palette } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight">
              AI-Powered Component Generation
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              ComponentForge generates production-ready, reusable components for React and HTML
              using advanced AI. Built for developers who want to build faster, smarter.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/agents/component-forge"
              className="btn-primary flex items-center justify-center gap-2"
            >
              Launch ComponentForge <ArrowRight size={20} />
            </Link>
            <a
              href="https://github.com/sumit-ingole/agent-studio"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <GitBranch size={20} /> View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Why ComponentForge?</h2>

        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="text-blue-600" size={32} />,
              title: 'Lightning Fast',
              description: 'Generate components in seconds with AI-powered code generation',
            },
            {
              icon: <Palette className="text-purple-600" size={32} />,
              title: 'Production Ready',
              description: 'Fully typed, tested, and styled components ready for immediate use',
            },
            {
              icon: <GitBranch className="text-green-600" size={32} />,
              title: 'Multi-Framework',
              description: 'Support for React and vanilla HTML + JS',
            },
          ].map((feature, i) => (
            <div key={i} className="card p-8 hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Capabilities</h2>

        <div className="grid sm:grid-cols-2 gap-8">
          {[
            {
              title: '🎯 Smart Parsing',
              description: 'Analyzes your requirements and extracts component specifications',
            },
            {
              title: '⚡ Groq AI Integration',
              description: 'Ultra-fast inference using Groq LLM for quick generation',
            },
            {
              title: '📦 Framework Support',
              description: 'Generate React (18+) and HTML5 components with best practices',
            },
            {
              title: '🎨 Beautiful Styling',
              description: 'Light theme, responsive design, minimal and aesthetic CSS',
            },
            {
              title: '📝 Full Documentation',
              description: 'Auto-generated JSDoc comments and type definitions',
            },
            {
              title: '💾 Multiple Formats',
              description: 'Download as ZIP, individual files, or copy to clipboard',
            },
          ].map((item, i) => (
            <div key={i} className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="card p-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to generate?</h2>
          <p className="text-slate-600 mb-8">
            Describe your component requirements and let AI handle the code generation
          </p>
          <Link
            href="/agents/component-forge"
            className="btn-primary inline-flex items-center gap-2"
          >
            Launch ComponentForge <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
