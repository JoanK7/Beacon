'use client';

// Daily stories: short, illustrative accounts of peer support making a
// difference. Everyone sees the same "today's story"; past ones stay here.
import Link from 'next/link';
import { ArrowRight, BookHeart, CheckCircle2 } from 'lucide-react';
import { useApi } from '@/lib/use-api';
import type { StoryList } from '@/lib/types';
import { Card, ErrorState, Loading, PageHeader, Pill, cx } from '@/components/ui';

export default function StoriesPage() {
  const { data, error, loading, reload } = useApi<StoryList>('/stories');
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;
  const read = data.stories.filter((s) => s.read).length;

  return (
    <>
      <PageHeader
        title="Peer support stories"
        description={`Short stories of peer support in action, one for each day. Each one earns ${data.pointsPerStory} points the first time you read it.`}
      />
      <p className="mb-5 text-xs text-muted">
        These are illustrative stories based on common peer-support situations. They are not about real people.
      </p>
      <p className="mb-3 text-sm font-semibold text-brand-900">
        {read} of {data.stories.length} read
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {data.stories.map((s) => {
          const isToday = data.today?.slug === s.slug;
          return (
            <li key={s.slug}>
              <Link
                href={`/stories/${s.slug}`}
                className={cx(
                  'group flex h-full items-center gap-3 rounded-3xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md',
                  isToday ? 'border-coral-400/60' : 'border-line/70',
                )}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-coral-50 text-coral-700">
                  <BookHeart className="size-6" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    {isToday && <Pill tone="beacon">Today</Pill>}
                    {s.read && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="size-3.5" aria-hidden /> Read
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block font-bold text-brand-900">{s.title}</span>
                  {s.module && <span className="block text-xs text-muted">Linked to: {s.module.title}</span>}
                </span>
                <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
      {data.stories.length === 0 && <Card>New stories are on their way.</Card>}
    </>
  );
}
