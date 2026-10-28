'use client';

import { ArrowRight, Clock, Compass, MessagesSquare } from 'lucide-react';
import { useApi } from '@/lib/use-api';
import { competencyFor } from '@/lib/competencies';
import { useSkillFocus } from '@/lib/skill-focus';
import type { ModuleSummary } from '@/lib/types';
import { Card, EmptyState, ErrorState, LinkButton, Loading, PageHeader, Pill, ProgressBar } from '@/components/ui';
import { JourneyPath, suggestedModule } from '@/components/journey-path';
import { Bea, SpeechBubble } from '@/components/mascot';

function UpNext({ module, suggested }: { module: ModuleSummary | null; suggested: boolean }) {
  if (!module) {
    return (
      <Card className="flex items-center gap-4 bg-beacon-50">
        <Bea mood="cheer" size={72} />
        <div>
          <p className="text-lg font-extrabold text-brand-900">Journey complete! 🎉</p>
          <p className="text-sm text-muted">You can revisit any module whenever you like a refresher.</p>
        </div>
      </Card>
    );
  }
  const { icon: Icon, soft, iconColor } = competencyFor(module.topic);
  const label = module.status === 'completed' ? 'Take the quiz' : module.status === 'in_progress' ? 'Resume' : 'Start';
  return (
    <Card className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-wide text-beacon-700">
        {suggested ? 'Suggested by your skill check' : 'Up next · no rush'}
      </p>
      <div className="flex items-start gap-3">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${soft}`}>
          <Icon className={`size-6 ${iconColor}`} aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-brand-900">{module.title}</h2>
          <p className="text-sm text-muted">{module.summary}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <ProgressBar value={(module.sectionsViewed / Math.max(module.sectionCount, 1)) * 100} label={`${module.title} progress`} />
        <div className="flex justify-between text-xs text-muted">
          <span>{module.sectionsViewed} of {module.sectionCount} sections</span>
          <span className="flex items-center gap-1"><Clock className="size-3" aria-hidden /> {module.estimatedMinutes} min</span>
        </div>
      </div>
      <LinkButton href={`/learn/${module.slug}`} className="w-full">
        {label} <ArrowRight className="size-4" aria-hidden />
      </LinkButton>
      {module.scenarioCount > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <MessagesSquare className="size-3.5" aria-hidden />
          Includes {module.scenarioCount} practice {module.scenarioCount === 1 ? 'conversation' : 'conversations'}
        </p>
      )}
    </Card>
  );
}

export default function LearnPage() {
  const { data, error, loading, reload } = useApi<{ modules: ModuleSummary[] }>('/modules');
  const skill = useSkillFocus();
  const modules = data?.modules ?? [];
  const badges = modules.filter((m) => m.hasBadge).length;
  const next = suggestedModule(modules, skill.focus);

  return (
    <>
      <PageHeader
        title="Your learning journey"
        description="Follow the path or jump to any skill that interests you. Already know a topic? Take its quiz straight away to test out."
      />
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && modules.length === 0 && (
        <EmptyState art={<Bea mood="think" size={80} />} title="No modules yet">New training is on its way. Check back soon!</EmptyState>
      )}
      {data && modules.length > 0 && (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
          <Card className="bg-white/70 py-6">
            <JourneyPath modules={modules} focus={skill.focus} />
          </Card>
          <aside className="order-first space-y-4 lg:order-none lg:sticky lg:top-24">
            <UpNext module={next} suggested={Boolean(next && skill.focus.has(next.slug))} />
            {!skill.loading && !skill.taken && (
              <Card className="flex items-start gap-3 bg-sky-soft">
                <Compass className="mt-0.5 size-6 shrink-0 text-sky-700" aria-hidden />
                <div className="space-y-2">
                  <p className="font-extrabold text-brand-900">Not sure where to start?</p>
                  <p className="text-sm text-muted">
                    A 5-minute skill check shows which topics you already know, so you can skip ahead.
                  </p>
                  <LinkButton href="/skill-check" variant="secondary" className="min-h-10">
                    Take the skill check
                  </LinkButton>
                </div>
              </Card>
            )}
            <Card className="flex items-center gap-3">
              <Bea mood="calm" size={52} />
              <SpeechBubble className="flex-1 shadow-none ring-0 bg-brand-50">
                {badges === 0
                  ? 'Every expert started at stop one. Take it at your own pace.'
                  : `You've collected ${badges} badge${badges === 1 ? '' : 's'} so far. Lovely progress!`}
              </SpeechBubble>
            </Card>
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              <Pill tone="beacon">✓ on yellow = badge earned</Pill>
              <Pill tone="brand">✓ on teal = read, quiz ready</Pill>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
