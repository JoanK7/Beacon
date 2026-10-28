'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardPlus, Compass, Heart, MapPin, MessagesSquare, Sparkles } from 'lucide-react';
import { useUser } from '@/lib/auth-context';
import { useApi } from '@/lib/use-api';
import { competencyFor } from '@/lib/competencies';
import { useSkillFocus } from '@/lib/skill-focus';
import type { ModuleSummary, Progress, ScenarioSummary } from '@/lib/types';
import { PersonaAvatar } from '@/components/persona-avatar';
import { Card, ErrorState, LinkButton, Loading, ProgressBar } from '@/components/ui';
import { NotTherapyNotice } from '@/components/safety-notice';
import { Bea, SpeechBubble } from '@/components/mascot';
import { JourneyStrip, suggestedModule } from '@/components/journey-path';

const QUICK_ACTIONS = [
  { href: '/sessions/new', label: 'Log a session', hint: 'Takes under a minute', icon: ClipboardPlus, tone: 'bg-brand-50 text-brand-700' },
  { href: '/directory', label: 'Find a service', hint: 'Campus & local help', icon: MapPin, tone: 'bg-sky-soft text-sky-700' },
  { href: '/reflect', label: 'Self-care check-in', hint: 'How are you feeling?', icon: Heart, tone: 'bg-lavender-50 text-lavender-700' },
];

/** A kind, situational greeting from Bea. Never mentions what you *haven't* done. */
function greeting(p: Progress) {
  if (p.modulesCompleted === 0 && p.sectionsViewed === 0) return "Hi, I'm Bea! I'll keep you company while you learn. Shall we start with a short first stop?";
  if (p.badges.length === p.modulesTotal && p.modulesTotal > 0) return "You've collected every badge. Come back for a refresher any time!";
  return 'Welcome back! No rush. Pick up wherever feels right today.';
}

export default function DashboardPage() {
  const user = useUser();
  const progress = useApi<{ progress: Progress }>('/progress');
  const modules = useApi<{ modules: ModuleSummary[] }>('/modules');
  const scenarios = useApi<{ scenarios: ScenarioSummary[] }>('/scenarios');
  const skill = useSkillFocus();

  if (progress.loading || modules.loading) return <Loading />;
  if (progress.error || modules.error || !progress.data || !modules.data) {
    return <ErrorState error={progress.error ?? modules.error} onRetry={() => { progress.reload(); modules.reload(); }} />;
  }

  const p = progress.data.progress;
  const list = modules.data.modules;
  const next = suggestedModule(list, skill.focus);
  const nextTone = next ? competencyFor(next.topic) : null;
  const scenarioList = scenarios.data?.scenarios ?? [];
  const featured = scenarioList.find((s) => !s.completed && !s.sensitive) ?? scenarioList.find((s) => !s.completed) ?? scenarioList[0];

  return (
    <div className="space-y-6">
      {/* Greeting with Bea */}
      <section className="flex items-end gap-3">
        <Bea mood="wave" size={84} bob />
        {/* min-w-0 lets this column shrink so long usernames wrap instead of overflowing */}
        <div className="min-w-0 flex-1 space-y-2 pb-2">
          <h1 className="break-words text-2xl font-extrabold text-brand-900 sm:text-3xl">Hello, {user.username}!</h1>
          <SpeechBubble className="max-w-xl">{greeting(p)}</SpeechBubble>
        </div>
      </section>

      {!skill.loading && !skill.taken && (
        <Card className="flex flex-col gap-3 border-sky-200 bg-sky-soft sm:flex-row sm:items-center">
          <Compass className="size-8 shrink-0 text-sky-700" aria-hidden />
          <div className="flex-1">
            <p className="font-extrabold text-brand-900">New here? Start with a 5-minute skill check</p>
            <p className="text-sm text-muted">It shows which topics you already know, so you only spend time where it helps.</p>
          </div>
          <LinkButton href="/skill-check" variant="secondary">
            Take the skill check
          </LinkButton>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Level card: soft and sunny, not dark and formal */}
        <Card as="section" aria-labelledby="level-heading" className="bg-gradient-to-br from-brand-50 via-white to-sky-soft lg:col-span-2">
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-full bg-beacon-500 text-brand-900 ring-4 ring-beacon-100">
              <span className="text-[10px] font-bold uppercase leading-none">Level</span>
              <span className="text-2xl font-extrabold leading-none">{p.level}</span>
            </span>
            <div className="flex-1">
              <h2 id="level-heading" className="text-xl font-extrabold text-brand-900">{p.name}</h2>
              <p className="text-sm text-muted">
                <Sparkles className="mr-1 inline size-4 text-beacon-700" aria-hidden />
                {p.points} learning points
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-1.5">
            <ProgressBar value={p.progressToNext} tone="beacon" label="Progress to next level" />
            <p className="text-xs text-muted">
              {p.nextLevelAt ? `${p.nextLevelAt - p.points} points until your next level` : 'Top level reached. Wonderful work!'}
            </p>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            {[
              ['Modules', `${p.modulesCompleted}/${p.modulesTotal}`],
              ['Badges', p.badges.length],
              ['Practised', `${p.scenariosCompleted}/${p.scenariosTotal}`],
              ['Sessions', p.sessionsLogged],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/80 p-3 ring-1 ring-line/70">
                <dt className="text-xs font-semibold text-muted">{label}</dt>
                <dd className="text-xl font-extrabold text-brand-900">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Gentle suggestion for what to do next */}
        <Card as="section" aria-labelledby="next-heading" className="flex flex-col">
          <h2 id="next-heading" className="text-xs font-bold uppercase tracking-wide text-beacon-700">Up next · whenever you&apos;re ready</h2>
          {next ? (
            <>
              <div className="mt-3 flex items-start gap-3">
                {nextTone && (
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${nextTone.soft}`}>
                    <nextTone.icon className={`size-5 ${nextTone.iconColor}`} aria-hidden />
                  </span>
                )}
                <div>
                  <p className="text-lg font-extrabold leading-tight text-brand-900">{next.title}</p>
                  <p className="mt-1 text-sm text-muted">{next.summary}</p>
                </div>
              </div>
              <div className="mt-auto space-y-1 pt-4">
                <ProgressBar value={(next.sectionsViewed / Math.max(next.sectionCount, 1)) * 100} label={`${next.title} progress`} />
                <p className="text-xs text-muted">{next.sectionsViewed} of {next.sectionCount} sections</p>
              </div>
              <LinkButton href={`/learn/${next.slug}`} className="mt-4">
                {next.status === 'completed' ? 'Take the quiz' : next.status === 'in_progress' ? 'Resume' : 'Start'}
                <ArrowRight className="size-4" aria-hidden />
              </LinkButton>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">You&apos;ve completed every module and earned every badge. 🎉</p>
          )}
        </Card>
      </div>

      {featured && (
        <Card as="section" aria-labelledby="practice-heading" className="flex flex-col gap-4 border-brand-200 bg-gradient-to-r from-white to-brand-50 sm:flex-row sm:items-center">
          <PersonaAvatar persona={featured.persona} size="lg" />
          <div className="flex-1">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">
              <MessagesSquare className="size-4" aria-hidden /> {featured.completed ? 'Replay a conversation' : 'Practice conversation'}
            </p>
            <h2 id="practice-heading" className="mt-1 text-lg font-extrabold text-brand-900">{featured.title}</h2>
            <p className="text-sm text-muted">{featured.summary}</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <LinkButton href={`/practice/${featured.slug}`}>
              {featured.completed ? 'Play again' : `Talk with ${featured.persona.name}`} <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
            <Link href="/practice" className="text-center text-sm font-bold text-brand-700 hover:underline">
              All conversations
            </Link>
          </div>
        </Card>
      )}

      <section aria-labelledby="quick-heading">
        <h2 id="quick-heading" className="mb-3 text-lg font-extrabold text-brand-900">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map(({ href, label, hint, icon: Icon, tone }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-3xl border border-line/70 bg-white p-4 shadow-[0_2px_12px_rgb(35_64_74/0.05)] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`flex size-12 items-center justify-center rounded-2xl ${tone}`}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-bold text-brand-900">{label}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </span>
              <ArrowRight className="ml-auto size-4 text-slate-400 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="journey-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="journey-heading" className="text-lg font-extrabold text-brand-900">Your learning journey</h2>
          <Link href="/learn" className="text-sm font-bold text-brand-700 hover:underline">
            See the full path
          </Link>
        </div>
        <Card>
          <JourneyStrip modules={list} focus={skill.focus} />
        </Card>
      </section>

      <NotTherapyNotice />
    </div>
  );
}
