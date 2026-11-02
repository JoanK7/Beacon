'use client';

// Quiz flow:
// 1. Load the overview (best score, how many questions a quiz shows).
// 2. Ask the server to start an attempt: it picks the questions from the
//    module's bank and shuffles the options, so answers can't be memorised.
// 3. Submit; the server scores against the questions it actually chose.
// Afterwards the learner can repeat the same questions (practice, no badge)
// or take a new quiz with different questions (can earn the badge).
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Award, CheckCircle2, Repeat, Shuffle, Timer, XCircle, Zap } from 'lucide-react';
import { Bea } from '@/components/mascot';
import { Celebration } from '@/components/celebration';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { Quiz, QuizAttempt, QuizResult } from '@/lib/types';
import { Alert, Button, Card, ErrorState, LinkButton, Loading, PageHeader, cx } from '@/components/ui';

function headline(result: QuizResult) {
  if (result.testedOut) return 'You tested out!';
  if (result.passed && result.mode === 'repeat') return 'Great practice!';
  if (result.passed) return 'You passed!';
  return 'Almost there! Every try helps you learn.';
}

function Result({
  result,
  onStart,
  starting,
}: {
  result: QuizResult;
  onStart: (mode: 'new' | 'repeat') => void;
  starting: 'new' | 'repeat' | null;
}) {
  return (
    <div className="space-y-5">
      <Card className={cx('text-center sm:p-10', result.passed ? 'border-beacon-400 bg-beacon-50' : '')}>
        <div className="flex justify-center">
          <Bea mood={result.passed ? 'cheer' : 'calm'} size={88} />
        </div>
        <p className="mt-3 text-4xl font-extrabold text-brand-900">{result.score}%</p>
        <p className="mt-1 font-bold text-brand-900">{headline(result)}</p>
        {result.testedOut && (
          <p className="text-sm text-muted">You already know this topic well. The module stays open if you ever want a refresher.</p>
        )}
        {result.passed && !result.canEarnBadge && (
          <p className="text-sm text-muted">Repeated quizzes are for practice. Take a new quiz with different questions to earn the badge.</p>
        )}
        {!result.passed && (
          <p className="text-sm text-muted">Have a look at the answers below, then try again whenever you like ({result.passingScore}% earns the badge).</p>
        )}
        <p className="text-sm text-muted">
          {result.correctCount} of {result.total} correct
        </p>
        {result.badge?.isNew && (
          <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-beacon-500 px-4 py-2 text-sm font-bold text-brand-900" role="status">
            <Award className="size-4" aria-hidden /> New badge: {result.badge.title} (+100 points)
          </p>
        )}
      </Card>

      {result.rushed && (
        <Alert tone="info" title="That was quick!">
          <span className="inline-flex items-start gap-1.5">
            <Timer className="mt-0.5 size-4 shrink-0" aria-hidden />
            Taking a little longer over each question helps the ideas stick. There&apos;s no timer, so go at your own pace.
          </span>
        </Alert>
      )}

      <section aria-labelledby="review-heading" className="space-y-3">
        <h2 id="review-heading" className="text-lg font-semibold text-brand-900">Review your answers</h2>
        {result.questions.map((q, i) => {
          const r = result.results[i];
          if (!r) return null;
          return (
            <Card key={i} className="space-y-2">
              <p className="flex items-start gap-2 font-semibold text-brand-900">
                {r.correct ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-label="Correct" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" aria-label="Incorrect" />
                )}
                {q.prompt}
              </p>
              {!r.correct && (
                <p className="pl-7 text-sm">
                  Correct answer: <strong>{q.options[r.correctIndex]}</strong>
                </p>
              )}
              {r.explanation && <p className="pl-7 text-sm text-muted">{r.explanation}</p>}
            </Card>
          );
        })}
      </section>

      <Card className="space-y-3">
        <p className="font-bold text-brand-900">Keep learning</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => onStart('new')} loading={starting === 'new'} disabled={starting !== null}>
            <Shuffle className="size-4" aria-hidden /> Take a new quiz
          </Button>
          <Button variant="secondary" onClick={() => onStart('repeat')} loading={starting === 'repeat'} disabled={starting !== null}>
            <Repeat className="size-4" aria-hidden /> Repeat this quiz
          </Button>
        </div>
        <p className="text-xs text-muted">
          A new quiz asks different questions from this module, and can earn the badge. Repeating asks the same questions again, for practice.
        </p>
      </Card>

      <div className="flex flex-wrap gap-3">
        <LinkButton href="/learn" variant="secondary">
          Back to modules
        </LinkButton>
        {result.passed && (
          <LinkButton href="/progress" variant="secondary">
            See my badges
          </LinkButton>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, error, loading } = useApi<{ quiz: Quiz }>(`/quiz/${slug}`);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [starting, setStarting] = useState<'new' | 'repeat' | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const start = useCallback(
    async (mode: 'new' | 'repeat') => {
      setStarting(mode);
      setStartError(null);
      try {
        const res = await api<{ attempt: QuizAttempt }>(`/quiz/${slug}/attempts`, { method: 'POST', body: { mode } });
        setAttempt(res.attempt);
        setAnswers({});
        setResult(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        setStartError(errorMessage(err));
      } finally {
        setStarting(null);
      }
    },
    [slug],
  );

  // Start the first attempt once the overview has loaded. The ref makes sure
  // this happens once (React may run effects twice in development), and state
  // is only set when the server answers.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!data || autoStarted.current) return;
    autoStarted.current = true;
    api<{ attempt: QuizAttempt }>(`/quiz/${slug}/attempts`, { method: 'POST', body: { mode: 'new' } })
      .then((res) => setAttempt(res.attempt))
      .catch((err: unknown) => setStartError(errorMessage(err)));
  }, [data, slug]);

  if (loading) return <Loading />;
  if (error || !data) {
    return (
      <div className="space-y-4">
        <ErrorState error={error} />
        <LinkButton href={`/learn/${slug}`} variant="secondary">Back to the module</LinkButton>
      </div>
    );
  }

  const quiz = data.quiz;
  const questions = attempt?.questions ?? [];
  const answeredAll = questions.length > 0 && questions.every((q) => answers[q.index] !== undefined);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!attempt) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = questions.map((q) => answers[q.index]);
      const res = await api<{ result: QuizResult }>(`/quiz/attempts/${attempt.attemptId}/submit`, { method: 'POST', body: { answers: payload } });
      setResult(res.result);
      setAttempt(null);
      if (res.result.badge?.isNew) setCelebrate(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const description = `Each quiz asks ${quiz.questionCount} questions from a bank of ${quiz.bankSize}. You need ${quiz.passingScore}% to earn the badge.${
    quiz.bestScore !== null ? ` Your best score so far: ${quiz.bestScore}%.` : ''
  }`;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={`/learn/${slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> {quiz.module.title}
      </Link>
      <PageHeader title={`${quiz.module.title} quiz`} description={description} />

      {!result && quiz.testOut && (
        <Alert tone="info" title="Testing out">
          <span className="inline-flex items-start gap-1.5">
            <Zap className="mt-0.5 size-4 shrink-0" aria-hidden />
            You haven&apos;t read this module yet, and that&apos;s fine. Pass the quiz to earn the badge straight away. If it
            doesn&apos;t go to plan, the module will be here to help.
          </span>
        </Alert>
      )}
      {attempt?.mode === 'repeat' && (
        <Alert tone="info" title="Practice round">
          The same questions as last time, in a new order. Repeats are for practice and don&apos;t earn the badge.
        </Alert>
      )}
      {startError && (
        <Alert tone="error">
          {startError}{' '}
          <button className="font-semibold underline" onClick={() => void start('new')}>Try again</button>
        </Alert>
      )}

      {result ? (
        <>
          <Celebration show={celebrate} title="New badge collected!" message={result.badge?.title} onClose={() => setCelebrate(false)} />
          <Result result={result} onStart={(mode) => void start(mode)} starting={starting} />
        </>
      ) : !attempt ? (
        !startError && <Loading />
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {questions.map((q) => (
            <Card as="fieldset" key={q.index} className="space-y-3">
              <legend className="sr-only">Question {q.index + 1}</legend>
              <p className="font-semibold text-brand-900">
                <span className="mr-2 text-beacon-700">{q.index + 1}.</span>
                {q.prompt}
              </p>
              <div className="space-y-2">
                {q.options.map((option, oi) => {
                  const checked = answers[q.index] === oi;
                  return (
                    <label
                      key={oi}
                      className={cx(
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition',
                        checked ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-brand-200',
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${q.index}`}
                        checked={checked}
                        onChange={() => setAnswers({ ...answers, [q.index]: oi })}
                        className="size-4 accent-brand-700"
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            </Card>
          ))}
          {submitError && <Alert tone="error">{submitError}</Alert>}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {Object.keys(answers).length} of {questions.length} answered
            </p>
            <Button type="submit" variant="accent" loading={submitting} disabled={!answeredAll}>
              Submit answers
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
