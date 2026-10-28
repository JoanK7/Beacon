'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Heart, ShieldAlert } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { SERVICE_TYPES, SESSION_CATEGORIES, SESSION_OUTCOMES, entries } from '@/lib/constants';
import type { Provider, SessionCategory, SessionOutcome } from '@/lib/types';

interface SessionForm {
  category: SessionCategory | '';
  outcome: SessionOutcome;
  notes: string;
  providerId: string;
}
import { Alert, Button, Card, Field, LinkButton, Loading, PageHeader, Select, Textarea, cx } from '@/components/ui';

function NewSessionForm() {
  const router = useRouter();
  const preselected = useSearchParams().get('provider') ?? '';
  const providers = useApi<{ providers: Provider[] }>('/providers');
  const [form, setForm] = useState<SessionForm>({
    category: '',
    outcome: 'listened',
    notes: '',
    providerId: /^\d+$/.test(preselected) ? preselected : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category) {
      setErrors({ category: 'Choose the main topic of the session.' });
      return;
    }
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      await api('/sessions', {
        method: 'POST',
        body: {
          category: form.category,
          outcome: form.providerId && form.outcome === 'listened' ? 'referred' : form.outcome,
          notes: form.notes,
          providerId: form.providerId ? Number(form.providerId) : null,
        },
      });
      setSaved(true);
    } catch (err) {
      setErrors(err instanceof ApiError ? err.fieldErrors() : {});
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <Card className="mx-auto max-w-xl space-y-4 text-center sm:p-10">
        <Heart className="mx-auto size-12 text-rose-500" aria-hidden />
        <h1 className="text-2xl font-bold text-brand-900">Session logged</h1>
        <p className="text-muted">
          Thank you for being there for a peer. Was that conversation heavy? A quick self-care check-in can help.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton href="/reflect" variant="accent">Do a check-in</LinkButton>
          <Button variant="secondary" onClick={() => router.push('/sessions')}>View my sessions</Button>
        </div>
      </Card>
    );
  }

  const set =
    (field: keyof SessionForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [field]: e.target.value });
  const providerList = providers.data?.providers ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/sessions" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Sessions
      </Link>
      <PageHeader title="Log a support session" description="Record what the session was about and any referral you suggested." />

      <Alert tone="warning" title="Protect your peer's privacy" className="mb-5">
        Never write names, student IDs or details that could identify the person you supported.
      </Alert>

      <Card as="form" onSubmit={onSubmit} className="space-y-5" noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}

        <Field label="What was the session mainly about?" id="category" error={errors.category}>
          <Select id="category" value={form.category} onChange={set('category')} error={errors.category}>
            <option value="">Choose a topic…</option>
            {entries(SESSION_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-brand-900">Outcome</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {entries(SESSION_OUTCOMES).map(([value, label]) => (
              <label
                key={value}
                className={cx(
                  'flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm',
                  form.outcome === value ? 'border-brand-500 bg-brand-50' : 'border-line',
                )}
              >
                <input type="radio" name="outcome" value={value} checked={form.outcome === value} onChange={set('outcome')} className="accent-brand-700" />
                {label}
              </label>
            ))}
          </div>
          {form.outcome === 'escalated' && (
            <p className="flex items-start gap-2 text-xs text-red-800">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              If anyone is in immediate danger, contact emergency services first. Logging here does not alert anyone.
            </p>
          )}
        </fieldset>

        <Field label="Referral (optional)" id="providerId" hint="Pick the service you suggested, if any.">
          {providers.loading ? (
            <p className="text-sm text-muted">Loading directory…</p>
          ) : (
            <Select id="providerId" value={form.providerId} onChange={set('providerId')}>
              <option value="">No referral</option>
              {entries(SERVICE_TYPES).map(([type, { label }]) => {
                const group = providerList.filter((p) => p.serviceType === type);
                return group.length ? (
                  <optgroup key={type} label={label}>
                    {group.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </Select>
          )}
        </Field>

        <Field label="Notes (optional)" id="notes" error={errors.notes} hint="Brief, non-identifying notes for your own follow-up. Max 2000 characters.">
          <Textarea id="notes" value={form.notes} onChange={set('notes')} maxLength={2000} error={errors.notes} />
        </Field>

        <div className="flex justify-end gap-3">
          <LinkButton href="/sessions" variant="ghost">Cancel</LinkButton>
          <Button type="submit" loading={saving}>Save session</Button>
        </div>
      </Card>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewSessionForm />
    </Suspense>
  );
}
