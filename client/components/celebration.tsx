'use client';

// A short, gentle celebration: soft confetti plus Bea cheering in a small card.
// Non-blocking: taps pass through the card to whatever is underneath (only the
// close button is clickable), it closes itself, and shows only the
// static card for people who prefer reduced motion (see globals.css).
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Bea } from './mascot';

const COLORS = ['#ffc857', '#14a394', '#ff8a6b', '#cbbeff', '#a8dfd3'];

// Precomputed with a tiny seeded generator so renders stay pure and stable.
const PIECES = (() => {
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: 32 }, (_, i) => ({
    left: `${Math.round(rand() * 100)}%`,
    delay: `${(rand() * 0.6).toFixed(2)}s`,
    size: 6 + Math.round(rand() * 6),
    round: i % 3 === 0,
    color: COLORS[i % COLORS.length],
  }));
})();

interface CelebrationProps {
  show: boolean;
  title: string;
  message?: string | null;
  onClose: () => void;
  duration?: number;
}

export function Celebration({ show, title, message, onClose, duration = 4500 }: CelebrationProps) {
  // Keep the latest onClose in a ref so re-renders don't restart the timer.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!show) return undefined;
    const timer = setTimeout(() => onCloseRef.current?.(), duration);
    return () => clearTimeout(timer);
  }, [show, duration]);

  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center p-4 pb-24 sm:items-center sm:pb-4">
      <div className="confetti-layer absolute inset-0 overflow-hidden" aria-hidden>
        {PIECES.map((p, i) => (
          <span
            key={i}
            className="absolute top-0 animate-confetti"
            style={{
              left: p.left,
              width: p.size,
              height: p.round ? p.size : p.size * 1.6,
              borderRadius: p.round ? '9999px' : '3px',
              background: p.color,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>
      <div
        role="status"
        className="pointer-events-none relative flex w-full max-w-sm animate-pop items-center gap-4 rounded-3xl bg-white p-5 shadow-[0_12px_40px_rgb(35_64_74/0.18)] ring-1 ring-line"
      >
        <Bea mood="cheer" size={72} />
        <div className="flex-1">
          <p className="text-lg font-extrabold text-brand-900">{title}</p>
          {message && <p className="mt-0.5 text-sm text-muted">{message}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="Close celebration"
          className="pointer-events-auto absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
