'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email'));
    const password = String(data.get('password'));
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) {
      setError('Invalid credentials');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className="container" style={{ maxWidth: 480, paddingTop: '6rem' }}>
      <div className="card">
        <h1>Moat Learning Portal</h1>
        <p>Sign in to continue.</p>
        <form onSubmit={onSubmit}>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" required /></label>
          {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
          <button type="submit">Login</button>
        </form>
      </div>
    </main>
  );
}
