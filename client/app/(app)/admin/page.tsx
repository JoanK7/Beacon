'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Archive, Eye, Pencil, Plus, Upload } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { CONTENT_STATUS_TONE, formatDate } from '@/lib/constants';
import type { AdminModuleRow, ContentStatus } from '@/lib/types';
import { Alert, Button, Card, ErrorState, LinkButton, Loading, PageHeader, Pill } from '@/components/ui';

export default function AdminModulesPage() {
  const { data, error, loading, reload } = useApi<{ modules: AdminModuleRow[] }>('/admin/modules');
  const [actionError, setActionError] = useState<string | null>(null);

  async function setStatus(id: number, status: ContentStatus) {
    setActionError(null);
    try {
      await api(`/admin/modules/${id}/status`, { method: 'PATCH', body: { status } });
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Training modules"
        description="Create, edit, publish and archive modules and their quizzes. Mark content verified once the clinical partner has approved it."
        action={
          <LinkButton href="/admin/modules/new">
            <Plus className="size-4" aria-hidden /> New module
          </LinkButton>
        }
      />
      {actionError && <Alert tone="error" className="mb-4">{actionError}</Alert>}
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <ul className="space-y-3">
          {data.modules.map((m) => (
            <Card as="li" key={m.id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={CONTENT_STATUS_TONE[m.status]}>{m.status}</Pill>
                  {m.contentVerified ? <Pill tone="success">Verified</Pill> : <Pill tone="beacon">Unverified</Pill>}
                  <span className="text-xs text-muted">Order {m.orderIndex} · updated {formatDate(m.updatedAt)}</span>
                </div>
                <p className="mt-1 font-semibold text-brand-900">{m.title}</p>
                <p className="text-sm text-muted">
                  {m.topic} · {m.sectionCount} sections · {m.questionCount} quiz questions
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {m.status === 'published' && (
                  <Link href={`/learn/${m.slug}`} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                    <Eye className="size-4" aria-hidden /> Preview
                  </Link>
                )}
                <LinkButton href={`/admin/modules/${m.id}`} variant="secondary">
                  <Pencil className="size-4" aria-hidden /> Edit
                </LinkButton>
                {m.status !== 'published' ? (
                  <Button variant="secondary" onClick={() => setStatus(m.id, 'published')}>
                    <Upload className="size-4" aria-hidden /> Publish
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setStatus(m.id, 'archived')}>
                    <Archive className="size-4" aria-hidden /> Archive
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
