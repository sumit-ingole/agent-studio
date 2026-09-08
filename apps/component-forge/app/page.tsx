'use client';

import Link from 'next/link';
import { ArrowRight, Bot, Code2, GitBranch, Sparkles, WandSparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="paper-grid">
      <section className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-7">
            <span className="eyebrow">
              <Sparkles size={14} /> Agent Studio
            </span>
            <h1 className="max-w-3xl text-5xl leading-[0.98] text-strong sm:text-7xl">
              Build the next idea, before the coffee gets cold.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted">
              A growing set of focused AI solutions for the work between a blank page and a shipped
              product.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/apps/component-forge" className="btn-primary gap-2">
                Explore Component Forge <ArrowRight size={18} />
              </Link>
              <a
                href="https://github.com/sumit-ingole/agent-studio"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary gap-2"
              >
                <GitBranch size={17} /> View the studio
              </a>
            </div>
          </div>
          <div className="spotlight-card card min-h-[340px] bg-[var(--color-primary)] p-7 text-[var(--color-bg)] sm:min-h-[420px] sm:p-10">
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono text-[var(--color-accent)]">/agent-studio</span>
                <Bot size={22} />
              </div>
              <div>
                <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  Currently shipping
                </p>
                <h2 className="max-w-md text-4xl font-extrabold leading-tight sm:text-5xl">
                  From intention to interface.
                </h2>
                <div className="mt-8 flex items-center gap-3 text-sm text-[var(--color-primary-soft)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" /> Component Forge
                  is live
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-9 sm:grid-cols-4 sm:px-8 lg:px-12">
          {[
            ['01', 'focused tools'],
            ['02', 'production output'],
            ['24/7', 'ready to iterate'],
            ['∞', 'more agents soon'],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-strong">{value}</p>
              <p className="mt-1 text-sm text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow">The toolkit</span>
            <h2 className="mt-4 text-4xl text-strong sm:text-5xl">
              Solutions with a point of view.
            </h2>
          </div>
          <p className="max-w-sm text-muted">
            Each agent is designed to make one meaningful part of building feel lighter.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Link href="/apps/component-forge" className="spotlight-card card group p-7 sm:p-9">
            <div className="relative z-10">
              <div className="mb-16 flex items-center justify-between">
                <span className="rounded-full bg-[var(--color-accent-soft)] p-3 text-[var(--color-accent)]">
                  <Code2 size={22} />
                </span>
                <span className="eyebrow">Live now</span>
              </div>
              <h3 className="text-3xl text-strong">Component Forge</h3>
              <p className="mt-3 max-w-md leading-7 text-muted">
                Turn a plain-English brief into clean, reusable React or HTML components with
                previewable output.
              </p>
              <span className="mt-8 inline-flex items-center gap-2 font-bold text-strong">
                Open the workspace{' '}
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
          <div className="spotlight-card card border-dashed p-7 sm:p-9">
            <div className="relative z-10">
              <div className="mb-16 flex items-center justify-between">
                <span className="rounded-full bg-[var(--color-primary-soft)] p-3 text-muted">
                  <WandSparkles size={22} />
                </span>
                <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted">
                  Coming soon
                </span>
              </div>
              <h3 className="text-3xl text-strong">More agents, less busywork.</h3>
              <p className="mt-3 max-w-md leading-7 text-muted">
                New focused tools for state, forms, and the small decisions that slow down a good
                build.
              </p>
              <span className="mt-8 inline-flex items-center gap-2 font-bold text-muted">
                The studio is expanding <Sparkles size={17} />
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-accent)] px-5 py-16 text-center text-[#241b18] sm:px-8">
        <h2 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Start with the idea. Leave with something real.
        </h2>
        <p className="mx-auto mt-5 max-w-xl leading-7 text-[#5d342c]">
          Component Forge is ready when you are. No ceremony, just a sharper first draft.
        </p>
        <Link
          href="/apps/component-forge"
          className="btn-primary mt-8 gap-2 bg-[#241b18] text-[#fff8ef] hover:bg-[#3d2923]"
        >
          Launch Component Forge <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
