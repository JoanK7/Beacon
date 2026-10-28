// The simulated peer in a scenario: a soft coloured circle with their initial.
// Deliberately not a photo or realistic face, so it reads as a practice character.
import { TONES } from '@/lib/competencies';
import type { ScenarioPersona } from '@/lib/types';
import { cx } from './ui';

export function PersonaAvatar({ persona, size = 'md' }: { persona: ScenarioPersona; size?: 'sm' | 'md' | 'lg' }) {
  const tone = TONES[persona.tone] ?? TONES.sky;
  return (
    <span
      aria-hidden
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full font-extrabold ring-2',
        tone.soft,
        tone.ring,
        tone.iconColor,
        size === 'sm' && 'size-9 text-sm',
        size === 'md' && 'size-12 text-lg',
        size === 'lg' && 'size-16 text-2xl',
      )}
    >
      {persona.name.charAt(0)}
    </span>
  );
}
