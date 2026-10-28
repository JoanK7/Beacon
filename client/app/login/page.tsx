'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, homeFor } from '@/lib/auth-context';
import { errorMessage } from '@/lib/api';
import { AuthLayout } from '@/components/auth-layout';
import { Alert, Button, Field, Input } from '@/components/ui';

/** Only allow redirects to internal paths, never to another site. */
function safeNext() {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(form);
      router.replace(safeNext() || homeFor(user));
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  const update = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your training."
      footer={
        <>
          New to Beacon?{' '}
          <Link href="/register" className="font-semibold text-brand-700 underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Username" id="username">
          <Input id="username" autoComplete="username" value={form.username} onChange={update('username')} required autoFocus />
        </Field>
        <Field label="Password" id="password">
          <Input id="password" type="password" autoComplete="current-password" value={form.password} onChange={update('password')} required />
        </Field>
        <Button type="submit" loading={submitting} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
