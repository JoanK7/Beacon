'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Lock, Trash2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { MOODS, formatDate } from '@/lib/constants';
import type { Reflection } from '@/lib/types';
import { Bea } from '@/components/mascot';
import { Alert, Button, Card, EmptyState, ErrorState, Field, Loading, PageHeader, Textarea, cx } from '@/components/ui';

type Feedback = { tone: 'success' | 'warning'; low: boolean } | { tone: 'error'; text: string };

const PROMPTS = [
  'What went well in your recent conversations?',
  'What felt heavy, and what might help you put it down?',
  'What is one small thing you can do for yourself today?',
];

export default function ReflectPage() {
  const { data, error, loading, reload } = useApi<{ reflections: Reflection[] }>('/reflections');
  const [mood, setMood] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Feedback | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mood) return;
    setSaving(true);
    setMessage(null);
    try {
      await api('/reflections', { method: 'POST', body: { moodRating: mood, freeText: text } });
      setMessage({ tone: mood <= 2 ? 'warning' : 'success', low: mood <= 2 });
      setMood(null);
      setText('');
      reload();
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm('Delete this reflection permanently?')) return;
    await api(`/reflections/${id}`, { method: 'DELETE' }).catch(() => {});
    reload();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div>
        <PageHeader title="Self-care check-in" description="Supporting others takes energy. Take a moment to notice how you are doing." />

        <Card as="form" onSubmit={onSubmit} className="space-y-5">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-brand-900">How are you feeling right now?</legend>
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((m) => (
                <label
                  key={m.value}
                  className={cx(
                    'flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-center transition sm:p-3',
                    mood === m.value ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-line hover:border-brand-200',
                  )}
                >
                  <input type="radio" name="mood" value={m.value} checked={mood === m.value} onChange={() => setMood(m.value)} className="sr-only" />
                  <span className="text-2xl sm:text-3xl" aria-hidden>{m.emoji}</span>
                  <span className="text-xs font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Anything you'd like to note? (optional)" id="reflection-text" hint={PROMPTS.join(' · ')}>
            <Textarea id="reflection-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
          </Field>

          {message?.tone === 'error' && <Alert tone="error">{message.text}</Alert>}
          {message?.tone === 'success' && <Alert tone="success">Check-in saved. Thank you for looking after yourself.</Alert>}
          {message && 'low' in message && message.low && (
            <Alert tone="warning" title="It sounds like things are tough right now">
              You don&apos;t have to carry it alone. Consider talking to your supervisor or a counsellor. You can find
              them in the <Link href="/directory?category=counselling" className="font-semibold underline">directory</Link>.
            </Alert>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Lock className="size-3.5" aria-hidden /> Private and encrypted
            </p>
            <Button type="submit" loading={saving} disabled={!mood}>Save check-in</Button>
          </div>
        </Card>
      </div>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="mb-3 text-lg font-semibold text-brand-900">Recent check-ins</h2>
        {loading && <Loading />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && data.reflections.length === 0 && (
          <EmptyState art={<Bea mood="calm" size={72} />} title="No check-ins yet">Whenever you need a moment, I&apos;m here.</EmptyState>
        )}
        {data && data.reflections.length > 0 && (
          <ul className="space-y-2">
            {data.reflections.map((r) => {
              const m = MOODS.find((x) => x.value === r.moodRating);
              return (
                <Card as="li" key={r.id} className="flex gap-3 p-4">
                  <span className="text-2xl" aria-label={m?.label}>{m?.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs text-muted">{formatDate(r.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    {r.freeText && <p className="mt-1 whitespace-pre-line text-sm">{r.freeText}</p>}
                  </div>
                  <button onClick={() => remove(r.id)} aria-label="Delete reflection" className="self-start rounded p-1 text-slate-400 hover:text-red-700">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </Card>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
