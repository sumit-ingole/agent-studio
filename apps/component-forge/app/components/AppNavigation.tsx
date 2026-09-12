'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogIn, UserCircle } from 'lucide-react';

export default function AppNavigation() {
  const [signedIn, setSignedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/profile', { cache: 'no-store' })
      .then((response) => {
        if (active) setSignedIn(response.ok);
      })
      .catch(() => {
        if (active) setSignedIn(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const authHref =
    typeof window === 'undefined'
      ? '/auth'
      : `/auth?returnTo=${encodeURIComponent(window.location.pathname)}`;

  async function handleSignout() {
    await fetch('/api/auth/signout', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <>
      <nav className="hidden items-center gap-6 sm:flex">
        <Link href="/" className="nav-link font-medium">
          Home
        </Link>
        <Link href={signedIn ? '/apps/component-forge' : authHref} className="nav-link font-medium">
          Component Forge
        </Link>
        <a
          href="https://github.com/sumit-ingole/agent-studio"
          className="nav-link font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </nav>
      <div className="ml-4 flex items-center gap-3">
        {!checking &&
          (signedIn ? (
            <>
              <Link
                href="/profile"
                aria-label="Open profile"
                title="Profile"
                className="text-strong transition hover:text-[var(--color-accent)]"
              >
                <UserCircle size={24} strokeWidth={1.8} />
              </Link>
              <button
                type="button"
                onClick={handleSignout}
                className="nav-link text-sm font-medium"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href={authHref} className="btn-secondary gap-2 px-4 py-2 text-sm">
              <LogIn size={16} /> Sign in
            </Link>
          ))}
      </div>
    </>
  );
}
