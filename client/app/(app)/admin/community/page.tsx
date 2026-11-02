'use client';

// Community wall moderation. Lists posts that were reported, hidden, or that
// mention possible risk. Posts stay anonymous here too: admins see the words,
// never who wrote them. Three reports hide a post automatically; an admin can
// restore it (it then can't be hidden by reports again) or hide it.
import { useState } from 'react';
import { Eye, EyeOff, Flag, LifeBuoy } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { MOODS, formatDate } from '@/lib/constants';
import type { ModerationPost } from '@/lib/types';
import { Alert, Button, Card, EmptyState, ErrorState, Loading, PageHeader, Pill } from '@/components/ui';

export default function AdminCommunityPage() {
  const { data, error, loading, reload } = useApi<{ posts: ModerationPost[] }>('/admin/community');
  const [actionError, setActionError] = useState<string | null>(null);

  async function setHidden(id: number, hidden: boolean) {
    setActionError(null);
    try {
      await api(`/admin/community/${id}`, { method: 'PATCH', body: { hidden } });
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Community wall"
        description="Posts that were reported, hidden, or that may mention risk. Authors stay anonymous to you as well."
      />
      <Alert tone="info" className="mb-4">
        Posts flagged for <strong>possible risk</strong> are never hidden automatically, so nobody asking for help is silenced. If
        a post worries you, follow the programme&apos;s safeguarding steps with the Wellness team.
      </Alert>
      {actionError && <Alert tone="error" className="mb-4">{actionError}</Alert>}
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.posts.length === 0 && <EmptyState icon={Flag} title="Nothing to review">No reported or flagged posts.</EmptyState>}
      {data && data.posts.length > 0 && (
        <ul className="space-y-3">
          {data.posts.map((p) => {
            const mood = MOODS.find((m) => m.value === p.mood);
            return (
              <Card as="li" key={p.id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.hidden ? <Pill tone="danger">Hidden</Pill> : <Pill tone="success">Visible</Pill>}
                    {p.reports > 0 && (
                      <Pill tone="beacon">
                        <Flag className="size-3" aria-hidden /> {p.reports} report{p.reports === 1 ? '' : 's'}
                      </Pill>
                    )}
                    {p.needsCare && (
                      <Pill tone="danger">
                        <LifeBuoy className="size-3" aria-hidden /> Possible risk
                      </Pill>
                    )}
                    {p.adminCleared && <Pill tone="brand">Restored by an admin</Pill>}
                  </div>
                  <p className="text-sm">
                    <span aria-hidden>{mood?.emoji} </span>
                    <span className="font-semibold">{mood?.label}</span>
                    <span className="text-muted"> · {formatDate(p.createdAt)}</span>
                  </p>
                  {p.note && <p className="break-words text-ink">{p.note}</p>}
                </div>
                {p.hidden ? (
                  <Button variant="secondary" onClick={() => setHidden(p.id, false)}>
                    <Eye className="size-4" aria-hidden /> Restore
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setHidden(p.id, true)}>
                    <EyeOff className="size-4" aria-hidden /> Hide
                  </Button>
                )}
              </Card>
            );
          })}
        </ul>
      )}
    </>
  );
}
