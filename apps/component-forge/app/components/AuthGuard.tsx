'use client';

import { ReactNode, useEffect, useState } from 'react';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/profile', { cache: 'no-store' })
      .then((response) => {
        if (!active) return;
        if (response.ok) {
          setAllowed(true);
          return;
        }
        const returnTo = `${window.location.pathname}${window.location.search}`;
        window.location.replace(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
      })
      .catch(() => {
        if (active) {
          const returnTo = `${window.location.pathname}${window.location.search}`;
          window.location.replace(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (allowed !== true) {
    return (
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="eyebrow justify-center">Private workspace</p>
        <h1 className="mt-4 text-3xl text-strong">Checking your access...</h1>
        <p className="mt-3 text-muted">We are preparing your workspace.</p>
      </main>
    );
  }

  return <>{children}</>;
}
