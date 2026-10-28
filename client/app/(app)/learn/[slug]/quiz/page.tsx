'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Award, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { Bea } from '@/components/mascot';
import { Celebration } from '@/components/celebration';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { Quiz, QuizResult } from '@/lib/types';
import { Alert, Button, Card, ErrorState, LinkButton, Loading, PageHeader, cx } from '@/components/ui';

function Result({ result, quiz, onRetry }: { result: QuizResult; quiz: Quiz; onRetry: () => void }) {
  return (
    <div className="space-y-5">
      <Card className={cx('text-center sm:p-10', result.passed ? 'border-beacon-400 bg-beacon-50' : '')}>
        <div className="flex justify-center">
          <Bea mood={result.passed ? 'cheer' : 'calm'} size={88} />
        </div>
        <p className="mt-3 text-4xl font-extrabold text-brand-900">{result.score}%</p>
        <p className="mt-1 font-bold text-brand-900">
          {result.testedOut ? 'You tested out!' : result.passed ? 'You passed!' : 'Almost there! Every try helps you learn.'}
        </p>
        {result.testedOut && (
          <p className="text-sm text-muted">You already know this topic well. The module stays open if you ever want a refresher.</p>
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

      <section aria-labelledby="review-heading" className="space-y-3">
        <h2 id="review-heading" className="text-lg font-semibold text-brand-900">Review your answers</h2>
        {quiz.questions.map((q, i) => {
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

      <div className="flex flex-wrap gap-3">
        {!result.passed && <Button onClick={onRetry}>Try again</Button>}
        <LinkButton href="/learn" variant={result.passed ? 'primary' : 'secondary'}>
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
  const { data, error, loading, reload } = useApi<{ quiz: Quiz }>(`/quiz/${slug}`);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
  const answeredAll = quiz.questions.every((q) => answers[q.index] !== undefined);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = quiz.questions.map((q) => answers[q.index]);
      const res = await api<{ result: QuizResult }>(`/quiz/${slug}/submit`, { method: 'POST', body: { answers: payload } });
      setResult(res.result);
      if (res.result.badge?.isNew) setCelebrate(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setResult(null);
    setAnswers({});
    reload();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={`/learn/${slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> {quiz.module.title}
      </Link>
      <PageHeader
        title={`${quiz.module.title} quiz`}
        description={`Answer all ${quiz.questions.length} questions. You need ${quiz.passingScore}% to earn the badge.${
          quiz.bestScore !== null ? ` Your best score so far: ${quiz.bestScore}%.` : ''
        }`}
      />

      {!result && quiz.testOut && (
        <Alert tone="info" title="Testing out">
          <span className="inline-flex items-start gap-1.5">
            <Zap className="mt-0.5 size-4 shrink-0" aria-hidden />
            You haven&apos;t read this module yet, and that&apos;s fine. Pass the quiz to earn the badge straight away. If it
            doesn&apos;t go to plan, the module will be here to help.
          </span>
        </Alert>
      )}

      {result ? (
        <>
          <Celebration
            show={celebrate}
            title="New badge collected!"
            message={result.badge?.title}
            onClose={() => setCelebrate(false)}
          />
          <Result result={result} quiz={quiz} onRetry={retry} />
        </>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {quiz.questions.map((q) => (
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
              {Object.keys(answers).length} of {quiz.questions.length} answered
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
