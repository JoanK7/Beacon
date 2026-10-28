'use client';

// Skill check: a short, low-stakes placement check across every module.
// - First time ("pre"): shows which topics a peer already knows, so they can
//   skip ahead or test out, and which ones to focus on.
// - Later ("post", end of pilot): the before/after knowledge measure (RQ3).
// Answers stay hidden while taking it. Afterwards, the peer reviews each
// question: what they chose, the correct answer and why, so they can improve.
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, RotateCcw, Target, XCircle } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { competencyFor } from '@/lib/competencies';
import { formatDate } from '@/lib/constants';
import type { SkillCheck, SkillResult, SkillSummary } from '@/lib/types';
import { Alert, Button, Card, ErrorState, LinkButton, Loading, PageHeader, ProgressBar, cx } from '@/components/ui';
import { Bea, SpeechBubble } from '@/components/mascot';

type Kind = 'pre' | 'post';

function ResultRow({ r }: { r: SkillResult }) {
  const { icon: Icon, soft, iconColor } = competencyFor(r.topic);
  const strong = r.level === 'strong';
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line/70 bg-white p-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-3">
        <span className={cx('flex size-11 shrink-0 items-center justify-center rounded-2xl', soft)}>
          <Icon className={cx('size-5', iconColor)} aria-hidden />
        </span>
        <div>
          <p className="font-bold text-brand-900">{r.title}</p>
          <p className={cx('flex items-center gap-1 text-sm font-semibold', strong ? 'text-brand-700' : 'text-coral-700')}>
            {strong ? <CheckCircle2 className="size-4" aria-hidden /> : <Target className="size-4" aria-hidden />}
            {strong ? 'Confident here' : 'Worth exploring'}
            <span className="font-normal text-muted">
              · {r.correct} of {r.total}
            </span>
          </p>
        </div>
      </div>
      {strong ? (
        <LinkButton href={`/learn/${r.slug}/quiz`} variant="secondary" className="min-h-10">
          Test out with the quiz
        </LinkButton>
      ) : (
        <LinkButton href={`/learn/${r.slug}`} className="min-h-10">
          Explore module
        </LinkButton>
      )}
    </li>
  );
}

/** Every answered question for one module: right or wrong, the correct answer and why. */
function ModuleReview({ r }: { r: SkillResult }) {
  if (!r.questions?.length) return null;
  const { icon: Icon, soft, iconColor } = competencyFor(r.topic);
  return (
    <section aria-labelledby={`review-${r.slug}`} className="space-y-2">
      <h3 id={`review-${r.slug}`} className="flex items-center gap-2 text-sm font-bold text-brand-900">
        <span className={cx('flex size-6 items-center justify-center rounded-lg', soft)}>
          <Icon className={cx('size-3.5', iconColor)} aria-hidden />
        </span>
        {r.title}
      </h3>
      {r.questions.map((q, i) => (
        <Card key={i} className="space-y-2 p-4">
          <p className="flex items-start gap-2 font-semibold text-brand-900">
            {q.correct ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-label="Correct" />
            ) : (
              <XCircle className="mt-0.5 size-5 shrink-0 text-coral-700" aria-label="Not quite" />
            )}
            {q.prompt}
          </p>
          <div className="space-y-1 pl-7 text-sm">
            <p>
              <span className="text-muted">Your answer: </span>
              <span className={q.correct ? 'font-semibold text-emerald-800' : 'text-ink'}>{q.options[q.chosen]}</span>
            </p>
            {!q.correct && (
              <p>
                <span className="text-muted">Correct answer: </span>
                <strong className="text-emerald-800">{q.options[q.correctIndex]}</strong>
              </p>
            )}
            {q.explanation && <p className="text-muted">{q.explanation}</p>}
          </div>
        </Card>
      ))}
    </section>
  );
}

function Results({ summary, kind, onRetake }: { summary: SkillSummary; kind: Kind; onRetake: (kind: Kind) => void }) {
  const strong = summary.results.filter((r) => r.level === 'strong').length;
  const hasReview = summary.results.some((r) => r.questions?.length);
  const correct = summary.results.reduce((n, r) => n + r.correct, 0);
  const total = summary.results.reduce((n, r) => n + r.total, 0);
  return (
    <div className="space-y-5">
      <Card className="flex flex-col items-center gap-4 bg-gradient-to-r from-brand-50 to-sky-soft sm:flex-row">
        <Bea mood="cheer" size={80} />
        <SpeechBubble className="flex-1">
          {strong === summary.results.length
            ? 'Wow, you already know a lot! Test out of the quizzes to collect your badges, or try the practice conversations.'
            : strong === 0
              ? "Great starting point! I've marked every topic as one to explore. Your journey path shows where to begin."
              : `You're confident in ${strong} of ${summary.results.length} topics. I've marked the others on your journey path as suggestions, and nothing is locked.`}
        </SpeechBubble>
      </Card>
      <ul className="space-y-3">
        {summary.results.map((r) => (
          <ResultRow key={r.slug} r={r} />
        ))}
      </ul>
      {hasReview && (
        <section aria-labelledby="review-heading" className="space-y-4">
          <div>
            <h2 id="review-heading" className="text-lg font-extrabold text-brand-900">
              Review your answers
            </h2>
            <p className="text-sm text-muted">
              {correct} of {total} correct. Each answer comes with a short explanation, so every question is a chance to learn.
            </p>
          </div>
          {summary.results.map((r) => (
            <ModuleReview key={r.slug} r={r} />
          ))}
        </section>
      )}
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-muted">
          {kind === 'pre' ? 'Starting' : 'Latest'} skill check taken {formatDate(summary.takenAt)}. Take it again any time to see
          how far you&apos;ve come.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton href="/learn">
            Go to my journey <ArrowRight className="size-4" aria-hidden />
          </LinkButton>
          <Button variant="secondary" onClick={() => onRetake('post')}>
            <RotateCcw className="size-4" aria-hidden /> Take it again
          </Button>
        </div>
      </div>
    </div>
  );
}

function Quiz({ check, kind, onDone }: { check: SkillCheck; kind: Kind; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = check.questions;
  const q = questions[index];
  const isLast = index === questions.length - 1;
  if (!q) return null;
  const chosen = answers[q.id];
  const { icon: Icon, soft, iconColor } = competencyFor(q.topic);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api('/skill-check', {
        method: 'POST',
        body: { kind, answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })) },
      });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl space-y-5 sm:p-8">
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-muted">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          <span>No time limit</span>
        </div>
        <ProgressBar value={((index + (chosen !== undefined ? 1 : 0)) / questions.length) * 100} label="Skill check progress" tone="beacon" />
      </div>

      <fieldset className="space-y-3">
        <legend className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
            <span className={cx('flex size-6 items-center justify-center rounded-lg', soft)}>
              <Icon className={cx('size-3.5', iconColor)} aria-hidden />
            </span>
            {q.moduleTitle}
          </span>
          <span className="block text-lg font-bold text-brand-900">{q.prompt}</span>
        </legend>
        {q.options.map((option, oi) => (
          <label
            key={oi}
            className={cx(
              'flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3.5 transition',
              chosen === oi ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-brand-200',
            )}
          >
            <input
              type="radio"
              name={q.id}
              checked={chosen === oi}
              onChange={() => setAnswers({ ...answers, [q.id]: oi })}
              className="mt-1 size-4 accent-brand-700"
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setIndex(index - 1)} disabled={index === 0}>
          <ArrowLeft className="size-4" aria-hidden /> Back
        </Button>
        {isLast ? (
          <Button onClick={submit} loading={submitting} disabled={Object.keys(answers).length < questions.length}>
            See my results
          </Button>
        ) : (
          <Button onClick={() => setIndex(index + 1)} disabled={chosen === undefined}>
            Next <ArrowRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>
      <p className="text-center text-xs text-muted">Not sure? Pick your best guess. This only helps suggest where to start.</p>
    </Card>
  );
}

export default function SkillCheckPage() {
  const { data, error, loading, reload } = useApi<SkillCheck>('/skill-check');
  const [taking, setTaking] = useState<Kind | null>(null);

  const pre = data?.latest.pre ?? null;
  const post = data?.latest.post ?? null;
  const latest = post && pre && new Date(post.takenAt) > new Date(pre.takenAt) ? post : (pre ?? post);
  const latestKind: Kind = latest === post && post ? 'post' : 'pre';

  return (
    <>
      <PageHeader
        title="Skill check"
        description="A quick look at what you already know, so you can spend your time where it helps most."
      />
      {loading && !data && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.questions.length === 0 && <Alert tone="info">The skill check will be ready once training modules are published.</Alert>}

      {data && data.questions.length > 0 && taking && (
        <Quiz
          key={taking}
          check={data}
          kind={taking}
          onDone={() => {
            setTaking(null);
            reload();
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      {data && data.questions.length > 0 && !taking && latest && (
        <Results summary={latest} kind={latestKind} onRetake={(kind) => setTaking(pre ? kind : 'pre')} />
      )}

      {data && data.questions.length > 0 && !taking && !latest && (
        <Card className="mx-auto max-w-xl space-y-5 text-center sm:p-8">
          <div className="flex justify-center">
            <Bea mood="wave" size={96} bob />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-brand-900">Where would you like to start?</h2>
            <p className="mt-2 text-muted">
              Answer {data.questions.length} quick questions, two from each topic. It isn&apos;t a test you can fail: it just
              shows which modules you might skip and which are worth exploring.
            </p>
          </div>
          <ul className="space-y-1 text-left text-sm text-muted">
            <li className="flex items-center gap-2">
              <Compass className="size-4 text-brand-600" aria-hidden /> About 5 minutes, no time limit
            </li>
            <li className="flex items-center gap-2">
              <Target className="size-4 text-brand-600" aria-hidden /> Your suggested topics appear on your journey path
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-brand-600" aria-hidden /> Your answers stay private; coordinators only see group averages
            </li>
          </ul>
          <Button onClick={() => setTaking('pre')} className="w-full sm:w-auto">
            Start the skill check <ArrowRight className="size-4" aria-hidden />
          </Button>
          <p className="text-xs text-muted">
            Rather jump straight in? <Link href="/learn" className="font-semibold text-brand-700 underline">Go to your journey</Link>.
          </p>
        </Card>
      )}
    </>
  );
}
