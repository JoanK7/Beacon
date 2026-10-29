'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Award, BookOpenCheck, Check, CheckCircle2, Clock, MessagesSquare, Zap } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { Alert, Button, Card, ErrorState, LinkButton, Loading, Pill, ProgressBar, cx } from '@/components/ui';
import { FormattedText } from '@/components/formatted-text';
import { DraftContentBanner, NotTherapyNotice } from '@/components/safety-notice';
import { Celebration } from '@/components/celebration';
import { Bea } from '@/components/mascot';
import { competencyFor } from '@/lib/competencies';
import type { ModuleDetail, ModuleSection, SectionViewResult } from '@/lib/types';
import { ListenButton } from '@/components/listen-button';
import { readingMinutes, toPlainText } from '@/lib/content-markup';

export default function ModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, error, loading, reload } = useApi<{ module: ModuleDetail }>(`/modules/${slug}`);
  const [index, setIndex] = useState<number | null>(null); // null = start at first unread section
  const [viewed, setViewed] = useState<Set<number>>(() => new Set());
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [justRead, setJustRead] = useState<number | null>(null); // sections read count, shown briefly after continuing

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  const mod = data.module;
  const sections = mod.sections;
  const isViewed = (s: ModuleSection) => s.viewed || viewed.has(s.id);
  const firstUnread = sections.findIndex((s) => !isViewed(s));
  const current = index ?? (firstUnread === -1 ? 0 : firstUnread);
  const section = sections[current];
  if (!section) return <ErrorState error={new Error('This module has no sections yet.')} />;
  const viewedCount = sections.filter(isViewed).length;
  const isComplete = completed || mod.status === 'completed';
  const isLast = current === sections.length - 1;
  const tone = competencyFor(mod.topic);

  async function markAndContinue() {
    setSaving(true);
    setSaveError(null);
    try {
      if (!isViewed(section)) {
        const result = await api<SectionViewResult>(`/modules/${slug}/sections/${section.id}/view`, { method: 'POST' });
        setViewed((prev) => new Set(prev).add(section.id));
        setJustRead(viewedCount + 1);
        if (result.status === 'completed' && !completed && mod.status !== 'completed') {
          setCompleted(true);
          setCelebrate(true); // first time finishing this module
        }
      }
      if (!isLast) {
        setIndex(current + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Celebration
        show={celebrate}
        title="Module complete!"
        message="Lovely work. The quiz is ready whenever you are."
        onClose={() => setCelebrate(false)}
      />
      <Link href="/learn" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Back to your journey
      </Link>

      <header>
        <div className="flex items-center gap-3">
          <span className={cx('flex size-12 shrink-0 items-center justify-center rounded-2xl', tone.soft)}>
            <tone.icon className={cx('size-6', tone.iconColor)} aria-hidden />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-beacon-700">{mod.topic}</p>
            <h1 className="text-2xl font-extrabold text-brand-900 sm:text-3xl">{mod.title}</h1>
          </div>
        </div>
        <p className="mt-1 text-muted">{mod.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="flex items-center gap-1"><Clock className="size-3" aria-hidden /> {mod.estimatedMinutes} min</span>
          {mod.badge && <Pill tone="beacon"><Award className="size-3" aria-hidden /> {mod.badge.title}</Pill>}
        </div>
      </header>

      {!mod.contentVerified && <DraftContentBanner sourceNote={mod.sourceNote} />}

      <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
        <aside aria-label="Module sections">
          <Card className="p-3 lg:sticky lg:top-20">
            <div className="px-2 pb-3">
              <ProgressBar value={(viewedCount / sections.length) * 100} label="Module progress" />
              <p className="mt-1.5 text-xs text-muted">{viewedCount} of {sections.length} sections read</p>
            </div>
            <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
              {sections.map((s, i) => (
                <li key={s.id} className="shrink-0">
                  <button
                    onClick={() => {
                      setIndex(i);
                      setJustRead(null);
                    }}
                    aria-current={i === current ? 'step' : undefined}
                    className={cx(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm',
                      i === current ? 'bg-brand-50 font-semibold text-brand-800' : 'text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    <span
                      className={cx(
                        'flex size-6 shrink-0 items-center justify-center rounded-full text-xs',
                        isViewed(s) ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {isViewed(s) ? <Check className="size-3.5" aria-label="Read" /> : i + 1}
                    </span>
                    <span className="hidden lg:inline">{s.heading}</span>
                  </button>
                </li>
              ))}
            </ol>
          </Card>
        </aside>

        <div className="space-y-4">
          <Card as="article" aria-labelledby="section-heading" className="sm:p-8">
            {justRead !== null && (
              <p key={justRead} role="status" className="mb-4 inline-flex animate-pop items-center gap-2 rounded-full bg-beacon-50 px-3 py-1.5 text-xs font-bold text-beacon-700 ring-1 ring-inset ring-beacon-400/60">
                <BookOpenCheck className="size-4" aria-hidden /> Nice! {justRead} of {sections.length} sections read
              </p>
            )}
            <div className="flex items-center gap-3">
              <span className={cx('flex size-10 shrink-0 items-center justify-center rounded-2xl', tone.soft)}>
                <tone.icon className={cx('size-5', tone.iconColor)} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-muted">
                  Section {current + 1} of {sections.length} · about {readingMinutes(section.body)} min
                </p>
                <div className="mt-1.5 flex gap-1" aria-hidden>
                  {sections.map((s, i) => (
                    <span
                      key={s.id}
                      className={cx(
                        'h-1.5 flex-1 rounded-full',
                        i === current ? 'bg-brand-600' : isViewed(s) ? 'bg-brand-200' : 'bg-line',
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-5 mt-4 flex items-start justify-between gap-3">
              <h2 id="section-heading" className="text-xl font-extrabold text-brand-900 sm:text-2xl">{section.heading}</h2>
              <ListenButton key={section.id} text={`${section.heading}. ${toPlainText(section.body)}`} label="Listen to this section" />
            </div>
            {section.mediaUrl && section.mediaType === 'image' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={section.mediaUrl} alt="" className="mb-4 w-full rounded-xl" loading="lazy" />
            )}
            {section.mediaUrl && section.mediaType === 'video' && (
              <video src={section.mediaUrl} controls preload="none" className="mb-4 w-full rounded-xl" />
            )}
            {section.mediaUrl && section.mediaType === 'audio' && (
              <audio src={section.mediaUrl} controls preload="none" className="mb-4 w-full" />
            )}
            <FormattedText text={section.body} />

            {saveError && <Alert tone="error" className="mt-4">{saveError}</Alert>}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <Button variant="ghost" onClick={() => {
                  setIndex(current - 1);
                  setJustRead(null);
                }} disabled={current === 0}>
                <ArrowLeft className="size-4" aria-hidden /> Previous
              </Button>
              {!(isLast && isViewed(section)) && (
                <Button onClick={markAndContinue} loading={saving}>
                  {isLast ? 'Finish module' : 'Mark as read & continue'}
                  {!isLast && <ArrowRight className="size-4" aria-hidden />}
                </Button>
              )}
            </div>
          </Card>

          {!isComplete && !mod.badge && mod.quiz && (
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Zap className="size-6 shrink-0 text-beacon-700" aria-hidden />
              <div className="flex-1">
                <p className="font-bold text-brand-900">Already know this topic?</p>
                <p className="text-sm text-muted">Take the quiz now. Pass it and you&apos;ll earn the badge without reading every section.</p>
              </div>
              <LinkButton href={`/learn/${slug}/quiz`} variant="secondary" className="min-h-10">
                Test out
              </LinkButton>
            </Card>
          )}

          {mod.scenarios.length > 0 && (
            <Card className="space-y-3">
              <h2 className="flex items-center gap-2 font-extrabold text-brand-900">
                <MessagesSquare className="size-5 text-brand-600" aria-hidden /> Practise this skill
              </h2>
              <ul className="space-y-2">
                {mod.scenarios.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/practice/${s.slug}`}
                      className="flex items-center gap-3 rounded-2xl bg-brand-50 px-4 py-3 font-semibold text-brand-900 transition hover:bg-brand-100"
                    >
                      <span className="flex-1">{s.title}</span>
                      {s.completed && <CheckCircle2 className="size-5 text-brand-600" aria-label="Played" />}
                      <ArrowRight className="size-4 text-brand-700" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {isComplete && mod.quiz && (
            <Card className="flex flex-col gap-4 border-beacon-400 bg-beacon-50 sm:flex-row sm:items-center animate-pop">
              <Bea mood={mod.badge ? 'cheer' : 'think'} size={60} />
              <div className="flex-1">
                <p className="font-extrabold text-brand-900">{mod.badge ? 'Badge earned! Fancy a quick refresher?' : 'Ready for a quick, friendly check?'}</p>
                <p className="text-sm text-muted">
                  {mod.quiz.questionCount} short questions. Try as many times as you like; there&apos;s no penalty.
                </p>
              </div>
              <LinkButton href={`/learn/${slug}/quiz`} variant="accent">
                {mod.badge ? 'Retake quiz' : 'Take the quiz'}
              </LinkButton>
            </Card>
          )}

          <NotTherapyNotice />
        </div>
      </div>
    </div>
  );
}
