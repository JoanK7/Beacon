'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiError, errorMessage } from '@/lib/api';
import { AuthLayout } from '@/components/auth-layout';
import { Alert, Button, Field, Input } from '@/components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '', university: 'African Leadership University', consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    try {
      await register(form);
      router.replace('/dashboard');
    } catch (err) {
      const fieldErrors = err instanceof ApiError ? err.fieldErrors() : {};
      setErrors(fieldErrors);
      setFormError(Object.keys(fieldErrors).length ? null : errorMessage(err));
      setSubmitting(false);
    }
  }

  const update = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Use a nickname. We never ask for your real name, email or phone number."
      footer={
        <>
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-brand-700 underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field label="Username (pseudonym)" id="username" error={errors.username} hint="3–30 letters, numbers, dots, dashes or underscores.">
          <Input id="username" autoComplete="username" value={form.username} onChange={update('username')} error={errors.username} required />
        </Field>
        <Field label="Password" id="password" error={errors.password} hint="At least 8 characters.">
          <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={update('password')} error={errors.password} required />
        </Field>
        <Field label="University" id="university" error={errors.university}>
          <Input id="university" value={form.university} onChange={update('university')} error={errors.university} />
        </Field>
        <div>
          <label className="flex items-start gap-3 rounded-xl bg-brand-50 p-3 text-sm">
            <input type="checkbox" checked={form.consent} onChange={update('consent')} className="mt-0.5 size-5 accent-brand-700" />
            <span>
              I have read the{' '}
              <Link href="/privacy" target="_blank" className="font-semibold text-brand-700 underline">
                privacy notice
              </Link>{' '}
              and agree to take part in the Beacon pilot. I understand I can withdraw and delete my data at any time.
            </span>
          </label>
          {errors.consent && <p className="mt-1 text-xs font-medium text-red-700">{errors.consent}</p>}
        </div>
        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
