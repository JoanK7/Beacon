// The learning journey: modules as stepping stones along a winding trail.
// Every stone is a link, so peers can open modules in any order. The path
// suggests a route but never locks anything (autonomy, Self-Determination Theory).
import Link from 'next/link';
import { Check, Target } from 'lucide-react';
import type { ModuleSummary } from '@/lib/types';
import { competencyFor } from '@/lib/competencies';
import { Bea } from './mascot';
import { cx } from './ui';

type StatusKey = 'badge' | 'done' | 'progress' | 'new';

function statusOf(m: ModuleSummary): { key: StatusKey; label: string } {
  if (m.hasBadge) return { key: 'badge', label: 'badge earned' };
  if (m.status === 'completed') return { key: 'done', label: 'read, quiz ready' };
  if (m.status === 'in_progress') return { key: 'progress', label: 'in progress' };
  return { key: 'new', label: 'not started' };
}

/**
 * The module we gently suggest next. If the skill check flagged areas to
 * practise, start with the first of those that has no badge yet; otherwise the
 * first unfinished module, else the first without a badge.
 */
export function suggestedModule(modules: ModuleSummary[], focus?: ReadonlySet<string>): ModuleSummary | null {
  const focused = focus?.size ? modules.find((m) => focus.has(m.slug) && !m.hasBadge) : undefined;
  return focused ?? modules.find((m) => m.status !== 'completed') ?? modules.find((m) => !m.hasBadge) ?? null;
}

interface PathProps {
  modules: ModuleSummary[];
  /** Slugs the skill check suggested practising (shown with a small target tag). */
  focus?: ReadonlySet<string>;
}

function Stone({ module, current, size = 'lg' }: { module: ModuleSummary; current: boolean; size?: 'lg' | 'sm' }) {
  const { icon: Icon, soft, ring, iconColor } = competencyFor(module.topic);
  const status = statusOf(module);
  const big = size === 'lg';
  return (
    <span className="relative inline-flex">
      <span
        className={cx(
          'flex items-center justify-center rounded-full ring-4 transition-transform group-hover:scale-105',
          big ? 'size-20' : 'size-14',
          soft,
          ring,
          current && 'ring-beacon-400 shadow-[0_0_0_8px_rgb(255_200_87/0.25)]',
          status.key === 'new' && !current && 'opacity-80',
        )}
      >
        <Icon className={cx(big ? 'size-9' : 'size-6', iconColor)} aria-hidden />
      </span>
      {(status.key === 'badge' || status.key === 'done') && (
        <span
          className={cx(
            'absolute -right-1 -top-1 flex items-center justify-center rounded-full ring-2 ring-white',
            big ? 'size-7' : 'size-5',
            status.key === 'badge' ? 'bg-beacon-500 text-brand-900' : 'bg-brand-600 text-white',
          )}
        >
          <Check className={big ? 'size-4' : 'size-3'} strokeWidth={3} aria-hidden />
        </span>
      )}
    </span>
  );
}

// Layout constants for the winding path. Every stop has a fixed height so the
// SVG trail can be drawn through the exact centre of each stepping stone.
const STOP_HEIGHT = 152; // px per stop
const STONE_CENTER_Y = 48; // link padding (8) + half the 80px stone
const SWING = 72; // px each stone shifts left/right of centre
const PATTERN = [0, 1, 0, -1]; // centre, right, centre, left, …
const WIDTH = 448; // matches max-w-md

/** Full vertical journey for the Learn page: stones wind along a curved dashed trail. */
export function JourneyPath({ modules, focus }: PathProps) {
  const next = suggestedModule(modules, focus);
  const points = modules.map((_, i): [number, number] => [WIDTH / 2 + PATTERN[i % PATTERN.length] * SWING, i * STOP_HEIGHT + STONE_CENTER_Y]);
  // Smooth S-curves between consecutive stones (vertical control points).
  const trail = points
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = points[i - 1];
      const mid = (y - py) / 2;
      return `C ${px} ${py + mid} ${x} ${y - mid} ${x} ${y}`;
    })
    .join(' ');

  return (
    <ol
      // overflow-x-clip: the trail SVG is drawn at a fixed 448px; on narrow phones
      // its unused edges are clipped so the page never scrolls sideways.
      className="relative mx-auto w-full max-w-md overflow-x-clip"
      style={{ height: modules.length * STOP_HEIGHT }}
      aria-label="Your learning journey"
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 overflow-visible"
        width={WIDTH}
        height={modules.length * STOP_HEIGHT}
        viewBox={`0 0 ${WIDTH} ${modules.length * STOP_HEIGHT}`}
      >
        <path d={trail} fill="none" stroke="#d3efe8" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 12" />
      </svg>
      {modules.map((m, i) => {
        const status = statusOf(m);
        const current = next?.slug === m.slug;
        const shift = PATTERN[i % PATTERN.length] * SWING;
        return (
          <li
            key={m.slug}
            className="absolute left-1/2 z-10 flex w-40 justify-center"
            style={{ top: i * STOP_HEIGHT, transform: `translateX(calc(-50% + ${shift}px))` }}
          >
            <Link
              href={`/learn/${m.slug}`}
              aria-label={`${m.title}: ${status.label}${focus?.has(m.slug) ? ', suggested by your skill check' : ''}`}
              aria-current={current ? 'step' : undefined}
              className="group flex flex-col items-center gap-2 rounded-3xl p-2 text-center"
            >
              <Stone module={m} current={current} />
              <span className="rounded-full bg-white/90 px-2 text-sm font-bold leading-tight text-brand-900">{m.title}</span>
              {focus?.has(m.slug) && !m.hasBadge && (
                <span className="inline-flex items-center gap-1 rounded-full bg-coral-50 px-2 py-0.5 text-[11px] font-bold text-coral-700">
                  <Target className="size-3" aria-hidden /> Suggested
                </span>
              )}
            </Link>
            {current && (
              <span className="pointer-events-none absolute -left-12 top-2" aria-hidden>
                <Bea mood="wave" size={56} bob />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Compact horizontal journey for the dashboard. */
export function JourneyStrip({ modules, focus }: PathProps) {
  const next = suggestedModule(modules, focus);
  return (
    <ol className="flex gap-1 overflow-x-auto pb-2 sm:justify-between" aria-label="Your learning journey">
      {modules.map((m, i) => {
        const status = statusOf(m);
        return (
          <li key={m.slug} className="flex shrink-0 items-center">
            <Link
              href={`/learn/${m.slug}`}
              aria-label={`${m.title}: ${status.label}`}
              className="group flex w-24 flex-col items-center gap-1.5 rounded-2xl p-1.5 text-center"
            >
              <Stone module={m} current={next?.slug === m.slug} size="sm" />
              <span className="text-xs font-semibold leading-tight text-ink">{m.title}</span>
            </Link>
            {i < modules.length - 1 && (
              <span aria-hidden className="hidden w-4 border-t-4 border-dotted border-brand-100 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
