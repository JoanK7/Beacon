// Learning streak, shown kindly: it celebrates days in a row and never
// shames a missed day (one rest day a week is built in, and a reset just
// says "welcome back").
import { Flame } from 'lucide-react';
import type { Streak } from '@/lib/types';
import { cx } from './ui';

export function streakMessage(s: Streak): string {
  if (s.current === 0 && s.best === 0) return 'Learn something today to start a streak.';
  if (s.current === 0) return `Welcome back! Your best streak is ${s.best} day${s.best === 1 ? '' : 's'}.`;
  if (!s.activeToday) return 'Keep it going: any learning today counts.';
  return `One rest day a week won’t break it.`;
}

export function StreakChip({ streak, className }: { streak: Streak; className?: string }) {
  const lit = streak.current > 0;
  return (
    <p
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ring-1 ring-inset',
        lit ? 'bg-coral-50 text-coral-700 ring-coral-400/40' : 'bg-white text-slate-600 ring-line',
        className,
      )}
      title={streakMessage(streak)}
    >
      <Flame className={cx('size-4', lit && streak.activeToday && 'fill-current')} aria-hidden />
      {lit ? `${streak.current}-day learning streak` : 'No streak yet'}
      <span className="sr-only">. {streakMessage(streak)}</span>
    </p>
  );
}
