'use client';

import { useEffect, useState } from 'react';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Completing sign in...');

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    if (!accessToken || !refreshToken) {
      setMessage('The sign-in callback was incomplete. Please try again.');
      return;
    }
    fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Session could not be created.');
        window.history.replaceState({}, document.title, '/auth');
        window.location.href = '/profile';
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  return (
    <main className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="text-muted">{message}</p>
    </main>
  );
}
