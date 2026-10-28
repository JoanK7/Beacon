// Visual identity for each core competency: an icon plus a soft colour set.
// Used by the journey path, module cards and badge stickers so each skill is
// recognisable at a glance (icons break up text, per content-heavy UX guidance).
import { BookOpen, Brain, Compass, Ear, HeartHandshake, Shield, Signpost, Sprout, type LucideIcon } from 'lucide-react';
import type { ToneName } from './types';

interface ToneClasses {
  soft: string;
  ring: string;
  iconColor: string;
  solid: string;
}

// Tailwind classes are written out in full so the compiler can find them.
export const TONES: Record<ToneName, ToneClasses> = {
  sky: { soft: 'bg-sky-soft', ring: 'ring-sky-200', iconColor: 'text-sky-700', solid: 'bg-sky-500' },
  mint: { soft: 'bg-brand-50', ring: 'ring-brand-200', iconColor: 'text-brand-700', solid: 'bg-brand-500' },
  coral: { soft: 'bg-coral-50', ring: 'ring-coral-400/40', iconColor: 'text-coral-700', solid: 'bg-coral-400' },
  lavender: { soft: 'bg-lavender-50', ring: 'ring-lavender-300', iconColor: 'text-lavender-700', solid: 'bg-lavender-300' },
  sunshine: { soft: 'bg-beacon-50', ring: 'ring-beacon-400', iconColor: 'text-beacon-700', solid: 'bg-beacon-500' },
};

// Matched by keyword so admin-created topics with similar names still map well.
const COMPETENCIES: { match: RegExp; icon: LucideIcon; tone: ToneName }[] = [
  { match: /role|intro/i, icon: Compass, tone: 'sky' },
  { match: /mental health|literacy/i, icon: Brain, tone: 'lavender' },
  { match: /listen|first aid/i, icon: Ear, tone: 'mint' },
  { match: /bound|confidential/i, icon: Shield, tone: 'coral' },
  { match: /disclos/i, icon: HeartHandshake, tone: 'lavender' },
  { match: /refer/i, icon: Signpost, tone: 'sunshine' },
  { match: /self-?care|wellbeing|burnout/i, icon: Sprout, tone: 'mint' },
];

export interface Competency extends ToneClasses {
  icon: LucideIcon;
  tone: ToneName;
}

/** Returns the icon and tone classes for a module topic, with a friendly fallback. */
export function competencyFor(topic = ''): Competency {
  const found = COMPETENCIES.find((c) => c.match.test(topic));
  const tone = found?.tone ?? 'sky';
  return { icon: found?.icon ?? BookOpen, tone, ...TONES[tone] };
}
