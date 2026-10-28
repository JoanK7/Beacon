'use client';

import { useState } from 'react';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { SESSION_CATEGORIES, SESSION_OUTCOMES, formatDate } from '@/lib/constants';
import type { SupportSession } from '@/lib/types';
import { Alert, Card, EmptyState, ErrorState, LinkButton, Loading, PageHeader, Pill } from '@/components/ui';
import { Bea } from '@/components/mascot';

export default function SessionsPage() {
  const { data, error, loading, reload } = useApi<{ sessions: SupportSession[] }>('/sessions');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function remove(id: number) {
    if (!window.confirm('Delete this session record permanently?')) return;
    setDeleteError(null);
    try {
      await api(`/sessions/${id}`, { method: 'DELETE' });
      reload();
    } catch (err) {
      setDeleteError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Support sessions"
        description="A private log of the support you have given and the referrals you have made."
        action={
          <LinkButton href="/sessions/new">
            <Plus className="size-4" aria-hidden /> Log a session
          </LinkButton>
        }
      />
      <p className="mb-5 flex items-center gap-2 text-xs text-muted">
        <Lock className="size-4" aria-hidden /> Only you can see these notes. They are encrypted before being stored.
      </p>
      {deleteError && <Alert tone="error" className="mb-4">{deleteError}</Alert>}
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.sessions.length === 0 && (
        <EmptyState art={<Bea mood="calm" size={80} />} title="No sessions yet, and that's okay!">
          After supporting a peer, log the session here. It takes under a minute.
        </EmptyState>
      )}
      {data && data.sessions.length > 0 && (
        <ul className="space-y-3">
          {data.sessions.map((s) => (
            <Card as="li" key={s.id} className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="brand">{SESSION_CATEGORIES[s.category]}</Pill>
                  <Pill tone={s.outcome === 'escalated' ? 'danger' : 'neutral'}>{SESSION_OUTCOMES[s.outcome]}</Pill>
                  <span className="text-xs text-muted">{formatDate(s.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                {s.notes && <p className="whitespace-pre-line text-sm text-ink">{s.notes}</p>}
                {s.referral && (
                  <p className="text-sm">
                    <span className="text-muted">Referred to: </span>
                    <span className="font-semibold text-brand-800">{s.referral.providerName}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(s.id)}
                className="inline-flex min-h-11 items-center gap-1 self-start rounded-lg px-2 text-sm text-slate-500 hover:bg-red-50 hover:text-red-700"
                aria-label="Delete session"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
