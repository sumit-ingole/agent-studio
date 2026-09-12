'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

const countryCodes = [
  { code: '+1', label: 'US/Canada' },
  { code: '+44', label: 'UK' },
  { code: '+61', label: 'Australia' },
  { code: '+91', label: 'India' },
  { code: '+81', label: 'Japan' },
  { code: '+49', label: 'Germany' },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobilePattern = /^\d{7,15}$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [loading, setLoading] = useState(false);
  const [returnTo, setReturnTo] = useState('/profile');

  useEffect(() => {
    const requestedPath = new URLSearchParams(window.location.search).get('returnTo');
    if (
      requestedPath?.startsWith('/') &&
      !requestedPath.startsWith('//') &&
      requestedPath !== '/auth'
    ) {
      setReturnTo(requestedPath);
    }
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobile = mobile.replace(/[\s()-]/g, '');
    if (!emailPattern.test(normalizedEmail)) {
      setMessageType('error');
      setMessage('Enter a valid email address.');
      return;
    }
    if (!passwordPattern.test(password)) {
      setMessageType('error');
      setMessage('Password must be at least 8 characters and include letters and numbers only.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setMessageType('error');
      setMessage('Enter your full name to create an account.');
      return;
    }
    if (mode === 'signup' && normalizedMobile && !mobilePattern.test(normalizedMobile)) {
      setMessageType('error');
      setMessage('Enter 7 to 15 digits for your mobile number.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'signup'
            ? {
                email: normalizedEmail,
                full_name: fullName.trim(),
                password,
                mobile: normalizedMobile ? `${countryCode}${normalizedMobile}` : null,
              }
            : { email: normalizedEmail, password }
        ),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessageType('error');
        setMessage(payload.message || 'Authentication failed. Please check your details.');
        return;
      }
      if (mode === 'signup') {
        setMessageType('success');
        setMessage(
          payload.requires_email_confirmation
            ? 'Account created, but email confirmation is still enabled in Supabase. Disable Confirm email in Supabase Auth settings, then sign in.'
            : 'Account created successfully. Sign in to open your workspace.'
        );
        setMode('signin');
        setPassword('');
        return;
      }
      window.location.href = returnTo;
    } catch {
      setMessageType('error');
      setMessage('We could not reach the authentication service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setMessage('');
    setPassword('');
  }

  const inputClass =
    'w-full rounded-lg border bg-transparent px-4 py-3 outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]';

  return (
    <main className="mx-auto max-w-xl px-5 py-16 sm:px-8">
      <div className="card border border-[var(--color-border)] bg-[var(--color-surface)] p-7 sm:p-10">
        <p className="eyebrow">Private workspace</p>
        <h1 className="mt-4 text-4xl text-strong">
          {mode === 'signin' ? 'Welcome back.' : 'Create your account.'}
        </h1>
        <p className="mt-4 leading-7 text-muted">
          Your details are secured and used only to provide Agent Studio features.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          {mode === 'signup' && (
            <input
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              className={inputClass}
              autoComplete="name"
            />
          )}
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className={inputClass}
            autoComplete="email"
          />
          {mode === 'signup' && (
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <select
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                className={`${inputClass} min-w-[112px]`}
                aria-label="Country code"
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.code} {country.label}
                  </option>
                ))}
              </select>
              <input
                inputMode="numeric"
                value={mobile}
                onChange={(event) => setMobile(event.target.value.replace(/[^\d\s()-]/g, ''))}
                placeholder="Mobile number (optional)"
                className={inputClass}
                autoComplete="tel-national"
              />
            </div>
          )}
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (8+ letters and numbers)"
            className={inputClass}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          {message && (
            <div
              role={messageType === 'error' ? 'alert' : 'status'}
              className={`rounded-lg border px-4 py-3 text-sm leading-6 ${messageType === 'error' ? 'border-[var(--color-error)]/30 bg-[var(--color-error)]/10 text-[var(--color-error)]' : 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]'}`}
            >
              {message}
            </div>
          )}
          <button
            disabled={loading}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <a href="/api/auth/oauth/google" className="btn-secondary justify-center">
            Continue with Google
          </a>
          <a href="/api/auth/oauth/github" className="btn-secondary justify-center">
            Continue with GitHub
          </a>
        </div>
        <button
          type="button"
          onClick={switchMode}
          className="mt-6 text-sm font-bold text-strong underline underline-offset-4"
        >
          {mode === 'signin' ? 'Create an account' : 'I already have an account'}
        </button>
        <p className="mt-6 text-sm text-muted">
          <Link href="/" className="underline underline-offset-4">
            Return home
          </Link>
        </p>
      </div>
    </main>
  );
}
