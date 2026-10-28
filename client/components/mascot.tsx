// Bea, Beacon's friendly lighthouse mascot. Drawn as inline SVG (no image
// files) so it costs almost nothing on slow connections and recolours with the
// palette. Bea only ever encourages: no frowns, no scolding.
import type { ReactNode } from 'react';
import { cx } from './ui';

export type BeaMood = 'wave' | 'cheer' | 'calm' | 'think';

interface ArmShape {
  d: string;
  hand: [number, number];
}

const INK = '#23404a';
const TEAL = '#14a394';
const SUN = '#ffc857';
const CORAL = '#ff8a6b';

// The tower outline, reused as a clip path for the stripe.
const BODY = 'M40 52 H80 Q84 52 84.5 56 L91 122 Q92 128 86 128 H34 Q28 128 29 122 L35.5 56 Q36 52 40 52 Z';

/** An arm drawn as an outlined, rounded limb ending in a hand. */
function Arm({ d, hand }: ArmShape) {
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="5" fill="#fff" stroke={INK} strokeWidth="2.5" />
    </g>
  );
}

const ARMS: Record<BeaMood, ArmShape[]> = {
  calm: [
    { d: 'M35 88 Q27 96 29 106', hand: [29, 107] },
    { d: 'M85 88 Q93 96 91 106', hand: [91, 107] },
  ],
  wave: [
    { d: 'M35 88 Q27 96 29 106', hand: [29, 107] },
    { d: 'M85 86 Q98 80 101 66', hand: [101, 63] },
  ],
  cheer: [
    { d: 'M35 86 Q22 80 19 66', hand: [19, 63] },
    { d: 'M85 86 Q98 80 101 66', hand: [101, 63] },
  ],
  think: [
    { d: 'M35 88 Q27 96 29 106', hand: [29, 107] },
    { d: 'M85 90 Q95 98 80 92', hand: [79, 91] },
  ],
};

function Face({ mood }: { mood: BeaMood }) {
  if (mood === 'cheer') {
    return (
      <g stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M45.5 71 Q50 65.5 54.5 71" />
        <path d="M65.5 71 Q70 65.5 74.5 71" />
        <path d="M52 77 Q60 90 68 77 Z" fill={INK} />
        <path d="M55.5 82.5 Q60 86 64.5 82.5" stroke={CORAL} strokeWidth="2.4" />
      </g>
    );
  }
  const lookUp = mood === 'think';
  return (
    <g>
      {[50, 70].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="70" rx="3.4" ry="4" fill={INK} />
          <circle cx={x + 1.1} cy={lookUp ? 67.6 : 68.6} r="1.2" fill="#fff" />
        </g>
      ))}
      {lookUp ? (
        <path d="M55 81 Q58 79 61 81 T67 81" stroke={INK} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M53 78.5 Q60 85.5 67 78.5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      )}
    </g>
  );
}

/**
 * @param {'wave'|'cheer'|'calm'|'think'} mood
 * @param {number} size  width in px (height keeps the 6:7 ratio)
 * @param {boolean} bob  gentle floating animation (disabled for reduced motion)
 */
interface BeaProps {
  mood?: BeaMood;
  size?: number;
  bob?: boolean;
  className?: string;
}

export function Bea({ mood = 'wave', size = 96, bob = false, className }: BeaProps) {
  const clipId = `bea-body-${mood}`;
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={(size * 140) / 120}
      className={cx('shrink-0 overflow-visible', bob && 'animate-bob', className)}
      aria-hidden
    >
      {/* light beams */}
      <path d="M60 37 L112 22 L112 50 Z" fill={SUN} opacity="0.35" />
      <path d="M60 37 L8 22 L8 50 Z" fill={SUN} opacity="0.35" />
      {/* ground */}
      <ellipse cx="60" cy="132" rx="36" ry="6" fill="#d3efe8" />
      {/* arms behind the body */}
      {ARMS[mood].map((arm) => (
        <Arm key={arm.d} {...arm} />
      ))}
      {/* tower */}
      <defs>
        <clipPath id={clipId}>
          <path d={BODY} />
        </clipPath>
      </defs>
      <path d={BODY} fill="#fff" />
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="98" width="120" height="11" fill={TEAL} />
      </g>
      <path d={BODY} fill="none" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      <rect x="53" y="113" width="14" height="15" rx="7" fill={INK} />
      {/* gallery, lantern, dome */}
      <rect x="33" y="46" width="54" height="8" rx="4" fill={INK} />
      <rect x="42" y="26" width="36" height="21" rx="6" fill={SUN} stroke={INK} strokeWidth="2.6" />
      <path d="M60 27 V46" stroke={INK} strokeWidth="2" opacity="0.5" />
      <path d="M38 28 Q60 4 82 28 Z" fill={CORAL} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="60" cy="9" r="3.2" fill={INK} />
      {/* cheeks + face */}
      <circle cx="43.5" cy="78" r="3.6" fill={CORAL} opacity="0.45" />
      <circle cx="76.5" cy="78" r="3.6" fill={CORAL} opacity="0.45" />
      <Face mood={mood} />
    </svg>
  );
}

/** A rounded speech bubble for Bea's kind words. The tail points at Bea (left). */
export function SpeechBubble({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'relative rounded-3xl rounded-bl-md bg-white px-4 py-3 text-sm font-semibold text-brand-900 shadow-[0_2px_12px_rgb(35_64_74/0.08)] ring-1 ring-line/70',
        className,
      )}
    >
      {children}
    </div>
  );
}
