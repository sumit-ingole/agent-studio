'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '../components/AuthGuard';

type Profile = {
  user: { email?: string; fullName?: string };
  usage24h: { generations: number; tokens: number };
  limits: { generations: number; tokens: number };
  prompts: Array<{ id: number; prompt: string }>;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then(async (response) => {
        if (!response.ok) throw new Error('Please sign in to view your profile.');
        setProfile(await response.json());
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  if (error)
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="text-4xl text-strong">Profile unavailable</h1>
        <p className="mt-4 text-muted">{error}</p>
        <Link href="/auth?returnTo=%2Fprofile" className="btn-primary mt-8 inline-flex">
          Sign in
        </Link>
      </main>
    );
  if (!profile)
    return (
      <main className="mx-auto max-w-5xl px-5 py-20">
        <p className="text-muted">Loading profile...</p>
      </main>
    );

  return (
    <AuthGuard>
      <main className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <p className="eyebrow">Account</p>
        <h1 className="mt-4 text-5xl text-strong">{profile.user.fullName || profile.user.email}</h1>
        <p className="mt-3 text-muted">{profile.user.email}</p>
        <section className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <p className="text-sm text-muted">Generations, rolling 24 hours</p>
            <p className="mt-3 text-4xl font-extrabold text-strong">
              {profile.usage24h.generations}{' '}
              <span className="text-lg font-medium text-muted">/ {profile.limits.generations}</span>
            </p>
          </div>
          <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <p className="text-sm text-muted">Model tokens, rolling 24 hours</p>
            <p className="mt-3 text-4xl font-extrabold text-strong">
              {profile.usage24h.tokens.toLocaleString()}{' '}
              <span className="text-lg font-medium text-muted">
                / {profile.limits.tokens.toLocaleString()}
              </span>
            </p>
          </div>
        </section>
        <section className="mt-10">
          <h2 className="text-2xl text-strong">Recent prompts</h2>
          <div className="mt-4 space-y-3">
            {profile.prompts.length ? (
              profile.prompts.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-[var(--color-border)] py-4 text-muted"
                >
                  {item.prompt}
                </div>
              ))
            ) : (
              <p className="text-muted">No prompts yet.</p>
            )}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
