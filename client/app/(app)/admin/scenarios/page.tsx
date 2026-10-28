'use client';

// Scenario role-plays are written in code (server/src/content/scenarios.ts) so
// every branch can be reviewed with the clinical partner. Admins decide which
// ones peers can see, e.g. switching off the sensitive risk scenario until
// Solid Minds has reviewed it.
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ShieldAlert, Upload } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { CONTENT_STATUS_TONE } from '@/lib/constants';
import type { AdminScenarioRow, ContentStatus } from '@/lib/types';
import { Alert, Button, Card, EmptyState, ErrorState, Loading, PageHeader, Pill } from '@/components/ui';

export default function AdminScenariosPage() {
  const { data, error, loading, reload } = useApi<{ scenarios: AdminScenarioRow[] }>('/admin/scenarios');
  const [actionError, setActionError] = useState<string | null>(null);

  async function setStatus(id: number, status: ContentStatus) {
    setActionError(null);
    try {
      await api(`/admin/scenarios/${id}/status`, { method: 'PATCH', body: { status } });
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Scenario role-plays"
        description="Practice conversations peers can play through. Scenario scripts are written in code so each branch can be reviewed; here you choose which ones peers can see."
      />
      <Alert tone="info" className="mb-4">
        Scenarios marked <strong>sensitive</strong> touch on risk topics. Keep them as drafts until the clinical partner has
        reviewed the wording. Completion counts are totals only; Beacon never shows which peer completed what.
      </Alert>
      {actionError && <Alert tone="error" className="mb-4">{actionError}</Alert>}
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.scenarios.length === 0 && <EmptyState title="No scenarios yet">Run the database seed to add them.</EmptyState>}
      {data && data.scenarios.length > 0 && (
        <ul className="space-y-3">
          {data.scenarios.map((s) => (
            <Card as="li" key={s.id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={CONTENT_STATUS_TONE[s.status]}>{s.status}</Pill>
                  {s.contentVerified ? <Pill tone="success">Verified</Pill> : <Pill tone="beacon">Pending review</Pill>}
                  {s.sensitive && (
                    <Pill tone="coral">
                      <ShieldAlert className="size-3" aria-hidden /> Sensitive
                    </Pill>
                  )}
                </div>
                <p className="mt-1 font-semibold text-brand-900">{s.title}</p>
                <p className="text-sm text-muted">
                  {s.moduleTitle ? `Linked to “${s.moduleTitle}”` : 'Not linked to a module'} · {s.completions}{' '}
                  {s.completions === 1 ? 'completion' : 'completions'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.status === 'published' && (
                  <Link
                    href={`/practice/${s.slug}`}
                    className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    <Eye className="size-4" aria-hidden /> Preview
                  </Link>
                )}
                {s.status === 'published' ? (
                  <Button variant="ghost" onClick={() => setStatus(s.id, 'draft')}>
                    <EyeOff className="size-4" aria-hidden /> Hide from peers
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setStatus(s.id, 'published')}>
                    <Upload className="size-4" aria-hidden /> Publish
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
