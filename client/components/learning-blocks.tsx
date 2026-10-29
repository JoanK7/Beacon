'use client';

// Building blocks for lessons: callouts, step lists, flip cards, quick checks
// and reveal prompts. They break up text (signalling and segmenting) and let
// learners recall ideas themselves (retrieval practice). Nothing here is graded
// or saved, and nothing blocks moving on: it is practice, at the learner's pace.
import { useId, useState } from 'react';
import { AlertTriangle, Check, Eye, Quote, RotateCw, Sparkles, Star, X, type LucideIcon } from 'lucide-react';
import { Bea } from './mascot';
import { cx } from './ui';
import { calloutLabel, parseInline, type CalloutKind } from '@/lib/content-markup';

/** Text with **key terms** in bold. `highlight` adds a soft highlighter stroke. */
export function RichText({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return (
    <>
      {parseInline(text).map((s, i) =>
        s.bold ? (
          <strong
            key={i}
            className={cx(
              'font-extrabold text-brand-900',
              highlight && 'bg-[linear-gradient(transparent_58%,var(--color-beacon-100)_58%)]',
            )}
          >
            {s.text}
          </strong>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

const CALLOUT_STYLE: Record<CalloutKind, { box: string; label: string; icon?: LucideIcon }> = {
  tip: { box: 'bg-beacon-50 ring-beacon-400/60', label: 'text-beacon-700' },
  remember: { box: 'bg-brand-50 ring-brand-200', label: 'text-brand-700', icon: Star },
  example: { box: 'bg-sky-soft ring-sky-200', label: 'text-sky-700', icon: Quote },
  'watch out': { box: 'bg-coral-50 ring-coral-400/40', label: 'text-coral-700', icon: AlertTriangle },
  'try this': { box: 'bg-lavender-50 ring-lavender-300', label: 'text-lavender-700', icon: Sparkles },
};

export function Callout({ kind, text }: { kind: CalloutKind; text: string }) {
  const style = CALLOUT_STYLE[kind];
  const Icon = style.icon;
  return (
    <aside className={cx('flex items-start gap-3 rounded-2xl p-4 ring-1 ring-inset', style.box)} aria-label={calloutLabel(kind)}>
      {kind === 'tip' ? (
        <Bea mood="think" size={38} className="-my-1" />
      ) : (
        Icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/80">
            <Icon className={cx('size-4', style.label)} aria-hidden />
          </span>
        )
      )}
      <div>
        <p className={cx('text-xs font-extrabold uppercase tracking-wide', style.label)}>{kind === 'tip' ? 'Bea’s tip' : calloutLabel(kind)}</p>
        <p className="mt-0.5 leading-relaxed">
          <RichText text={text} />
        </p>
      </div>
    </aside>
  );
}

/** Numbered stepping stones joined by a line, for ideas that come in order. */
export function StepList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li
          key={i}
          className="relative flex items-start gap-3 before:absolute before:top-9 before:-bottom-3 before:left-4 before:w-0.5 before:bg-brand-200 last:before:hidden"
        >
          <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-extrabold text-white shadow-sm">
            {i + 1}
          </span>
          <span className="pt-1 leading-relaxed">
            <RichText text={item} />
          </span>
        </li>
      ))}
    </ol>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 leading-relaxed">
          <span className="mt-2.5 size-2 shrink-0 rounded-full bg-beacon-500" aria-hidden />
          <span>
            <RichText text={item} highlight />
          </span>
        </li>
      ))}
    </ul>
  );
}

const CARD_TONES = ['bg-brand-50 ring-brand-200', 'bg-sky-soft ring-sky-200', 'bg-lavender-50 ring-lavender-300', 'bg-beacon-50 ring-beacon-400/60', 'bg-coral-50 ring-coral-400/40'];

/** Tap-to-flip cards: the front names an idea, the back explains it. */
export function FlipCards({ cards }: { cards: { front: string; back: string }[] }) {
  const [flipped, setFlipped] = useState<Set<number>>(() => new Set());
  const toggle = (i: number) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const short = cards.every((c) => c.front.length <= 3);

  return (
    <div>
      <ul className={cx('grid gap-3', short ? 'grid-cols-2 sm:grid-cols-3' : 'sm:grid-cols-2')}>
        {cards.map((card, i) => {
          const open = flipped.has(i);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={open}
                className={cx(
                  'group flex min-h-24 w-full flex-col justify-center rounded-2xl p-4 text-left ring-1 ring-inset transition hover:-translate-y-0.5 hover:shadow-md',
                  open ? 'bg-white ring-brand-200 shadow-sm' : CARD_TONES[i % CARD_TONES.length],
                )}
              >
                {open ? (
                  <span key="back" className="animate-flip block">
                    <span className="block text-xs font-extrabold uppercase tracking-wide text-brand-700">{card.front}</span>
                    <span className="mt-1 block leading-relaxed">
                      <RichText text={card.back} />
                    </span>
                  </span>
                ) : (
                  <span key="front" className="animate-flip flex items-center justify-between gap-3">
                    <span className={cx('font-extrabold text-brand-900', short ? 'text-3xl' : 'text-lg')}>{card.front}</span>
                    <RotateCw className="size-4 shrink-0 text-muted transition group-hover:rotate-90" aria-hidden />
                  </span>
                )}
                <span className="sr-only">{open ? ' (tap to flip back)' : ' (tap to see what it means)'}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted" aria-live="polite">
        {flipped.size === cards.length ? 'All cards flipped. Nice!' : `${flipped.size} of ${cards.length} flipped`}
      </p>
    </div>
  );
}

/** One practice question with instant, kind feedback. Not saved or scored. */
export function QuickCheck({ prompt, options, explanation }: { prompt: string; options: { text: string; correct: boolean }[]; explanation: string }) {
  const id = useId();
  const [tried, setTried] = useState<number[]>([]);
  const solved = tried.some((i) => options[i]?.correct);
  const last = tried[tried.length - 1];

  return (
    <section aria-labelledby={`${id}-q`} className="rounded-2xl bg-white p-4 ring-2 ring-brand-200 sm:p-5">
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-brand-700">
        <Sparkles className="size-4" aria-hidden /> Check yourself
      </p>
      <p id={`${id}-q`} className="mt-1 font-bold text-brand-900">
        <RichText text={prompt} />
      </p>
      <div className="mt-3 space-y-2" role="group" aria-labelledby={`${id}-q`}>
        {options.map((o, i) => {
          const picked = tried.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setTried((t) => [...t, i])}
              disabled={solved || picked}
              aria-pressed={picked}
              className={cx(
                'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ring-1 ring-inset transition',
                picked && o.correct && 'bg-brand-50 text-brand-900 ring-brand-500',
                picked && !o.correct && 'bg-coral-50 text-coral-700 ring-coral-400/50',
                !picked && 'bg-canvas ring-line enabled:hover:bg-brand-50 enabled:hover:ring-brand-200',
                solved && !picked && 'opacity-60',
              )}
            >
              <span
                className={cx(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs',
                  picked ? (o.correct ? 'bg-brand-700 text-white' : 'bg-coral-400 text-white') : 'bg-white ring-1 ring-line',
                )}
              >
                {picked && (o.correct ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />)}
              </span>
              <span>{o.text}</span>
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {solved ? (
          <p className="mt-3 animate-pop rounded-xl bg-brand-50 p-3 text-sm leading-relaxed">
            <span className="font-extrabold text-brand-800">{tried.length === 1 ? 'Spot on! ' : 'You got there! '}</span>
            <RichText text={explanation} />
          </p>
        ) : (
          last !== undefined && <p className="mt-3 text-sm font-semibold text-coral-700">Not quite. Have another go; every try helps you learn.</p>
        )}
      </div>
    </section>
  );
}

/** A reflection prompt: think first, then compare with a suggested answer. */
export function RevealPrompt({ prompt, answer }: { prompt: string; answer: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl bg-lavender-50 p-4 ring-1 ring-inset ring-lavender-300 sm:p-5">
      <p className="text-xs font-extrabold uppercase tracking-wide text-lavender-700">Think, then reveal</p>
      <p className="mt-1 font-bold text-brand-900">
        <RichText text={prompt} />
      </p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`${id}-a`}
        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-lavender-700 ring-1 ring-inset ring-lavender-300 transition hover:bg-lavender-50"
      >
        <Eye className="size-4" aria-hidden /> {open ? 'Hide the suggested answer' : 'Show a suggested answer'}
      </button>
      {open && (
        <p id={`${id}-a`} className="mt-3 animate-pop rounded-xl bg-white p-3 text-sm leading-relaxed">
          <RichText text={answer} />
        </p>
      )}
    </section>
  );
}
