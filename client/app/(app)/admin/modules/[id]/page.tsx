'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { ContentStatus, EditableModule, EditableQuestion, EditableSection, MediaType } from '@/lib/types';
import { Alert, Button, Card, ErrorState, Field, Input, Loading, Select, Textarea } from '@/components/ui';
import { FormattedText } from '@/components/formatted-text';
import { FormattingHelp } from '@/components/formatting-help';

const EMPTY_MODULE: EditableModule = {
  slug: '',
  title: '',
  topic: '',
  summary: '',
  orderIndex: 0,
  estimatedMinutes: 10,
  status: 'draft',
  contentVerified: false,
  sections: [{ heading: '', body: '', mediaType: null, mediaUrl: null }],
  quiz: { passingScore: 70, questions: [{ prompt: '', options: ['', ''], answerIndex: 0, explanation: '' }] },
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

interface IconButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function IconButton({ label, onClick, children, disabled }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function ModuleEditor({ initial, isNew }: { initial: EditableModule; isNew: boolean }) {
  const router = useRouter();
  const [m, setM] = useState<EditableModule>(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const set = (patch: Partial<EditableModule>) => {
    setSaved(false);
    setM((prev) => ({ ...prev, ...patch }));
  };
  const setSection = (i: number, patch: Partial<EditableSection>) => set({ sections: m.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const setQuestion = (i: number, patch: Partial<EditableQuestion>) =>
    set({ quiz: { ...m.quiz, questions: m.quiz.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) } });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    // The server assigns ids; strip the module id from the payload.
    const { id, ...rest } = m;
    const payload = {
      ...rest,
      orderIndex: Number(m.orderIndex),
      estimatedMinutes: Number(m.estimatedMinutes),
      sections: m.sections.map((s) => ({ ...s, mediaType: s.mediaUrl ? s.mediaType || 'image' : null })),
      quiz: { ...m.quiz, passingScore: Number(m.quiz.passingScore) },
    };
    try {
      const res = isNew
        ? await api<{ module: EditableModule }>('/admin/modules', { method: 'POST', body: payload })
        : await api<{ module: EditableModule }>(`/admin/modules/${initial.id}`, { method: 'PUT', body: payload });
      if (isNew) {
        router.replace(`/admin/modules/${res.module.id}`);
      } else {
        setM(res.module);
        setSaved(true);
      }
    } catch (err) {
      setErrors(
        err instanceof ApiError && err.details.length
          ? err.details.map((d) => `${d.field || 'form'}: ${d.message}`)
          : [errorMessage(err)],
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            <ArrowLeft className="size-4" aria-hidden /> All modules
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-brand-900">{isNew ? 'New module' : `Edit: ${initial.title}`}</h1>
        </div>
        <Button type="submit" loading={saving}>
          {isNew ? 'Create module' : 'Save changes'}
        </Button>
      </div>

      {errors.length > 0 && (
        <Alert tone="error" title="Please fix the following">
          <ul className="list-disc pl-5">
            {errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </Alert>
      )}
      {saved && <Alert tone="success">Changes saved.</Alert>}

      <Card className="grid gap-4 sm:grid-cols-2">
        <h2 className="text-lg font-semibold text-brand-900 sm:col-span-2">Details</h2>
        <Field label="Title" id="title">
          <Input
            id="title"
            value={m.title}
            onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
          />
        </Field>
        <Field label="URL slug" id="slug" hint="Lowercase words separated by dashes.">
          <Input
            id="slug"
            value={m.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set({ slug: e.target.value });
            }}
          />
        </Field>
        <Field label="Competency / topic" id="topic">
          <Input id="topic" value={m.topic} onChange={(e) => set({ topic: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Order" id="orderIndex">
            <Input id="orderIndex" type="number" min={0} value={m.orderIndex} onChange={(e) => set({ orderIndex: e.target.value })} />
          </Field>
          <Field label="Minutes" id="estimatedMinutes">
            <Input id="estimatedMinutes" type="number" min={1} value={m.estimatedMinutes} onChange={(e) => set({ estimatedMinutes: e.target.value })} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Summary" id="summary">
            <Textarea id="summary" className="min-h-20" value={m.summary} onChange={(e) => set({ summary: e.target.value })} />
          </Field>
        </div>
        <Field label="Status" id="status">
          <Select id="status" value={m.status} onChange={(e) => set({ status: e.target.value as ContentStatus })}>
            <option value="draft">Draft (hidden from peers)</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </Field>
        <label className="flex items-center gap-3 self-end rounded-xl bg-beacon-50 p-3 text-sm">
          <input type="checkbox" checked={m.contentVerified} onChange={(e) => set({ contentVerified: e.target.checked })} className="size-5 accent-brand-700" />
          Content verified by the clinical partner
        </label>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-900">Sections</h2>
          <Button type="button" variant="secondary" onClick={() => set({ sections: [...m.sections, { heading: '', body: '', mediaType: null, mediaUrl: null }] })}>
            <Plus className="size-4" aria-hidden /> Add section
          </Button>
        </div>
        <FormattingHelp />
        {m.sections.map((s, i) => (
          <fieldset key={s.id ?? `new-${i}`} className="space-y-3 rounded-xl border border-line p-4">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-semibold text-muted">Section {i + 1}</legend>
              <div className="flex">
                <IconButton label="Move up" onClick={() => set({ sections: move(m.sections, i, i - 1) })} disabled={i === 0}><ArrowUp className="size-4" /></IconButton>
                <IconButton label="Move down" onClick={() => set({ sections: move(m.sections, i, i + 1) })} disabled={i === m.sections.length - 1}><ArrowDown className="size-4" /></IconButton>
                <IconButton label="Remove section" onClick={() => set({ sections: m.sections.filter((_, j) => j !== i) })} disabled={m.sections.length === 1}><Trash2 className="size-4" /></IconButton>
              </div>
            </div>
            <Field label="Heading" id={`s-${i}-heading`}>
              <Input id={`s-${i}-heading`} value={s.heading} onChange={(e) => setSection(i, { heading: e.target.value })} />
            </Field>
            <Field label="Body" id={`s-${i}-body`}>
              <Textarea id={`s-${i}-body`} className="min-h-36 font-mono text-sm" value={s.body} onChange={(e) => setSection(i, { body: e.target.value })} />
            </Field>
            {s.body.trim() && (
              <details className="rounded-xl border border-line p-3">
                <summary className="cursor-pointer text-sm font-bold text-brand-700">Preview as learners see it</summary>
                <div className="mt-3">
                  <FormattedText text={s.body} />
                </div>
              </details>
            )}
            <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
              <Field label="Media type" id={`s-${i}-mt`}>
                <Select id={`s-${i}-mt`} value={s.mediaType || 'image'} onChange={(e) => setSection(i, { mediaType: e.target.value as MediaType })}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                </Select>
              </Field>
              <Field label="Media URL (optional)" id={`s-${i}-url`}>
                <Input id={`s-${i}-url`} type="url" placeholder="https://…" value={s.mediaUrl || ''} onChange={(e) => setSection(i, { mediaUrl: e.target.value })} />
              </Field>
            </div>
          </fieldset>
        ))}
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-brand-900">Quiz</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="passingScore" className="text-sm font-semibold">Pass mark %</label>
            <Input id="passingScore" type="number" min={1} max={100} className="w-24" value={m.quiz.passingScore} onChange={(e) => set({ quiz: { ...m.quiz, passingScore: e.target.value } })} />
          </div>
        </div>
        {m.quiz.questions.map((q, i) => (
          <fieldset key={i} className="space-y-3 rounded-xl border border-line p-4">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-semibold text-muted">Question {i + 1}</legend>
              <IconButton label="Remove question" onClick={() => set({ quiz: { ...m.quiz, questions: m.quiz.questions.filter((_, j) => j !== i) } })} disabled={m.quiz.questions.length === 1}>
                <Trash2 className="size-4" />
              </IconButton>
            </div>
            <Field label="Question" id={`q-${i}`}>
              <Input id={`q-${i}`} value={q.prompt} onChange={(e) => setQuestion(i, { prompt: e.target.value })} />
            </Field>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-brand-900">Options <span className="font-normal text-muted">(select the correct one)</span></p>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`q-${i}-answer`}
                    checked={q.answerIndex === oi}
                    onChange={() => setQuestion(i, { answerIndex: oi })}
                    aria-label={`Option ${oi + 1} is correct`}
                    className="size-5 accent-emerald-600"
                  />
                  <Input
                    aria-label={`Option ${oi + 1}`}
                    value={opt}
                    onChange={(e) => setQuestion(i, { options: q.options.map((o, k) => (k === oi ? e.target.value : o)) })}
                  />
                  <IconButton
                    label="Remove option"
                    disabled={q.options.length <= 2}
                    onClick={() =>
                      setQuestion(i, {
                        options: q.options.filter((_, k) => k !== oi),
                        answerIndex: q.answerIndex === oi ? 0 : q.answerIndex > oi ? q.answerIndex - 1 : q.answerIndex,
                      })
                    }
                  >
                    <X className="size-4" />
                  </IconButton>
                </div>
              ))}
              {q.options.length < 6 && (
                <button type="button" onClick={() => setQuestion(i, { options: [...q.options, ''] })} className="text-sm font-semibold text-brand-700 hover:underline">
                  + Add option
                </button>
              )}
            </div>
            <Field label="Explanation shown after answering (optional)" id={`q-${i}-exp`}>
              <Input id={`q-${i}-exp`} value={q.explanation || ''} onChange={(e) => setQuestion(i, { explanation: e.target.value })} />
            </Field>
          </fieldset>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => set({ quiz: { ...m.quiz, questions: [...m.quiz.questions, { prompt: '', options: ['', ''], answerIndex: 0, explanation: '' }] } })}
        >
          <Plus className="size-4" aria-hidden /> Add question
        </Button>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>{isNew ? 'Create module' : 'Save changes'}</Button>
      </div>
    </form>
  );
}

export default function EditModulePage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const { data, error, loading, reload } = useApi<{ module: EditableModule }>(isNew ? null : `/admin/modules/${id}`);

  if (isNew) return <ModuleEditor initial={EMPTY_MODULE} isNew />;
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;
  return <ModuleEditor key={data.module.id} initial={data.module} isNew={false} />;
}
