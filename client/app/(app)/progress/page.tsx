'use client';

import Link from 'next/link';
import { Award, BookOpen, ClipboardList, Heart, MapPin, MessagesSquare } from 'lucide-react';
import { competencyFor } from '@/lib/competencies';
import { useApi } from '@/lib/use-api';
import { formatDate } from '@/lib/constants';
import type { ModuleSummary, Progress } from '@/lib/types';
import { Card, ErrorState, Loading, PageHeader, ProgressBar, cx } from '@/components/ui';

export default function ProgressPage() {
  const progress = useApi<{ progress: Progress }>('/progress');
  const modules = useApi<{ modules: ModuleSummary[] }>('/modules');

  if (progress.loading || modules.loading) return <Loading />;
  if (progress.error || modules.error || !progress.data || !modules.data) {
    return <ErrorState error={progress.error ?? modules.error} onRetry={progress.reload} />;
  }

  const p = progress.data.progress;
  const earned = new Map(p.badges.map((b) => [b.moduleSlug, b]));

  const stats = [
    { label: 'Sections read', value: p.sectionsViewed, icon: BookOpen },
    { label: 'Conversations practised', value: `${p.scenariosCompleted}/${p.scenariosTotal}`, icon: MessagesSquare },
    { label: 'Sessions logged', value: p.sessionsLogged, icon: ClipboardList },
    { label: 'Referrals made', value: p.referralsMade, icon: MapPin },
    { label: 'Check-ins', value: p.reflectionsWritten, icon: Heart },
  ];

  return (
    <>
      <PageHeader title="Progress & badges" description="Your own journey, at your own pace. Points come from learning: reading sections, finishing modules, passing quizzes and practising conversations." />

      <Card className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-beacon-500 text-3xl font-extrabold text-brand-900 ring-4 ring-beacon-100" aria-label={`Level ${p.level}`}>
          {p.level}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-xl font-bold text-brand-900">
            {p.name} <span className="text-base font-medium text-muted">· {p.points} points</span>
          </p>
          <ProgressBar value={p.progressToNext} tone="beacon" label="Progress to next level" />
          <p className="text-sm text-muted">{p.nextLevelAt ? `Next level at ${p.nextLevelAt} points` : 'You have reached the top level.'}</p>
        </div>
      </Card>

      <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4">
            <Icon className="mb-2 size-5 text-brand-500" aria-hidden />
            <dd className="text-2xl font-bold text-brand-900">{value}</dd>
            <dt className="text-xs text-muted">{label}</dt>
          </Card>
        ))}
      </dl>

      <h2 className="mb-3 text-lg font-extrabold text-brand-900">
        Your badge collection <span className="text-sm font-medium text-muted">({p.badges.length} of {modules.data.modules.length})</span>
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {modules.data.modules.map((m) => {
          const badge = earned.get(m.slug);
          const { icon: Icon, soft, ring, iconColor } = competencyFor(m.topic);
          return (
            <li key={m.slug}>
              <Link
                href={`/learn/${m.slug}`}
                className={cx(
                  'group flex h-full flex-col items-center gap-2 rounded-3xl border p-4 text-center transition hover:-translate-y-0.5',
                  badge ? 'border-beacon-400 bg-white shadow-[0_2px_12px_rgb(255_200_87/0.25)]' : 'border-dashed border-line bg-white/70',
                )}
              >
                {/* A "sticker": the competency icon on its own colour, with a sunshine rim once earned */}
                <span
                  className={cx(
                    'relative flex size-16 items-center justify-center rounded-full ring-4 transition group-hover:rotate-3',
                    badge ? cx(soft, 'ring-beacon-500') : cx('bg-slate-50 grayscale', ring, 'opacity-60'),
                  )}
                >
                  <Icon className={cx('size-7', badge ? iconColor : 'text-slate-400')} aria-hidden />
                  {badge && (
                    <Award className="absolute -bottom-1 -right-1 size-6 rounded-full bg-beacon-500 p-1 text-brand-900 ring-2 ring-white" aria-hidden />
                  )}
                </span>
                <span className="text-sm font-bold text-brand-900">{m.topic}</span>
                <span className="text-xs text-muted">{badge ? `Collected ${formatDate(badge.earnedAt)}` : "Not yet, whenever you're ready"}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
