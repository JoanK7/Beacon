'use client';

import { useState } from 'react';
import { CheckCircle2, EyeOff } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { SUS_ITEMS } from '@/lib/constants';
import { Alert, Button, Card, Field, LinkButton, PageHeader, Textarea, cx } from '@/components/ui';

const SCALE = [1, 2, 3, 4, 5];

export default function FeedbackPage() {
  const [answers, setAnswers] = useState(Array(10).fill(null));
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const answered = answers.filter(Boolean).length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api('/feedback', { method: 'POST', body: { susAnswers: answers, comment: comment || undefined } });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-xl space-y-4 text-center sm:p-10">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <h1 className="text-2xl font-bold text-brand-900">Thank you!</h1>
        <p className="text-muted">Your anonymous feedback helps us improve Beacon for every peer supporter.</p>
        <LinkButton href="/dashboard">Back to home</LinkButton>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Share your feedback" description="Ten quick statements about using Beacon (the System Usability Scale), plus an optional comment." />
      <Alert tone="info" className="mb-5">
        <span className="flex items-center gap-2">
          <EyeOff className="size-4" aria-hidden /> Your answers are stored anonymously, with no link to your account.
        </span>
      </Alert>

      <form onSubmit={onSubmit} className="space-y-3">
        {SUS_ITEMS.map((item, i) => (
          <Card as="fieldset" key={i} className="p-4">
            <legend className="sr-only">Statement {i + 1}</legend>
            <p className="mb-3 text-sm font-semibold text-brand-900">
              {i + 1}. {item}
            </p>
            <div className="flex items-center gap-2">
              <span className="hidden w-20 text-xs text-muted sm:block">Strongly disagree</span>
              <div className="grid flex-1 grid-cols-5 gap-2">
                {SCALE.map((v) => (
                  <label
                    key={v}
                    className={cx(
                      'flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold',
                      answers[i] === v ? 'border-brand-700 bg-brand-700 text-white' : 'border-line hover:border-brand-200',
                    )}
                  >
                    <input
                      type="radio"
                      name={`sus-${i}`}
                      value={v}
                      checked={answers[i] === v}
                      onChange={() => setAnswers(answers.map((a, j) => (j === i ? v : a)))}
                      className="sr-only"
                    />
                    <span aria-hidden>{v}</span>
                    <span className="sr-only">{v} of 5</span>
                  </label>
                ))}
              </div>
              <span className="hidden w-20 text-right text-xs text-muted sm:block">Strongly agree</span>
            </div>
          </Card>
        ))}

        <Card>
          <Field label="Anything else you'd like to tell us? (optional)" id="comment">
            <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
          </Field>
        </Card>

        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{answered} of 10 answered</p>
          <Button type="submit" loading={submitting} disabled={answered < 10}>Submit feedback</Button>
        </div>
      </form>
    </div>
  );
}
