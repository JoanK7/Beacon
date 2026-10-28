'use client';

// Practice: scenario role-plays, the heart of Beacon's gamification. Peers try
// out real conversations safely. Every choice teaches something and nobody
// can fail, so it feels like play rather than a test.
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MessagesSquare, ShieldAlert, Sparkles } from 'lucide-react';
import { useApi } from '@/lib/use-api';
import type { ScenarioSummary } from '@/lib/types';
import { Alert, Card, EmptyState, ErrorState, Loading, PageHeader, Pill } from '@/components/ui';
import { Bea, SpeechBubble } from '@/components/mascot';
import { PersonaAvatar } from '@/components/persona-avatar';

function ScenarioCard({ scenario: s }: { scenario: ScenarioSummary }) {
  return (
    <Card as="li" className="p-0 transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/practice/${s.slug}`} className="flex h-full flex-col gap-3 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <PersonaAvatar persona={s.persona} />
          <div className="min-w-0">
            <p className="font-bold text-brand-900">{s.persona.name}</p>
            <p className="truncate text-xs text-muted">{s.persona.context}</p>
          </div>
          {s.completed && <CheckCircle2 className="ml-auto size-6 shrink-0 text-brand-600" aria-label="Played" />}
        </div>
        <div>
          <h2 className="text-lg font-extrabold leading-snug text-brand-900">{s.title}</h2>
          <p className="mt-1 text-sm text-muted">{s.summary}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          {s.module && <Pill tone="brand">{s.module.title}</Pill>}
          {s.sensitive && (
            <Pill tone="coral">
              <ShieldAlert className="size-3" aria-hidden /> Sensitive topic
            </Pill>
          )}
          {s.bestInsight !== null && (
            <Pill tone="beacon">
              <Sparkles className="size-3" aria-hidden /> Best insight {s.bestInsight}%
            </Pill>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-sm font-bold text-brand-700">
            {s.completed ? 'Play again' : 'Start'} <ArrowRight className="size-4" aria-hidden />
          </span>
        </div>
      </Link>
    </Card>
  );
}

export default function PracticePage() {
  const { data, error, loading, reload } = useApi<{ scenarios: ScenarioSummary[] }>('/scenarios');
  const scenarios = data?.scenarios ?? [];
  const played = scenarios.filter((s) => s.completed).length;
  const unverified = scenarios.some((s) => !s.contentVerified);

  return (
    <>
      <PageHeader
        title="Practice conversations"
        description="Step into realistic moments from peer support and choose what to say. You'll see how each response lands, and you can always try again."
      />
      <Card className="mb-6 flex items-center gap-4 bg-gradient-to-r from-brand-50 to-sky-soft">
        <Bea mood={played > 0 ? 'cheer' : 'wave'} size={72} bob />
        <SpeechBubble className="flex-1">
          {played === 0
            ? 'There are no wrong turns here. Every choice shows you something, so explore freely!'
            : `You've practised ${played} of ${scenarios.length} conversations. Replaying one is a great way to try a different approach.`}
        </SpeechBubble>
      </Card>

      {unverified && (
        <Alert tone="warning" className="mb-5">
          These scenarios are adapted from the Solid Minds peer counsellor training and are awaiting their review.
        </Alert>
      )}

      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && scenarios.length === 0 && (
        <EmptyState icon={MessagesSquare} title="No practice conversations yet">
          New scenarios are on their way. Check back soon!
        </EmptyState>
      )}
      {scenarios.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {scenarios.map((s) => (
            <ScenarioCard key={s.slug} scenario={s} />
          ))}
        </ul>
      )}
    </>
  );
}
