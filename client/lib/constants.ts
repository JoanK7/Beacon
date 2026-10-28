// Display labels shared across screens. Keys match the API enums, so the
// compiler flags any label missing for a value the server can return.
import type { ContentStatus, ServiceType, SessionCategory, SessionOutcome } from './types';

export type PillTone = 'brand' | 'beacon' | 'success' | 'danger' | 'neutral' | 'coral' | 'lavender';

export const CONTENT_STATUS_TONE: Record<ContentStatus, PillTone> = { published: 'success', draft: 'neutral', archived: 'danger' };

export const SERVICE_TYPES: Record<ServiceType, { label: string; tone: PillTone }> = {
  emergency: { label: 'Emergency', tone: 'danger' },
  counselling: { label: 'Counselling', tone: 'brand' },
  medical: { label: 'Medical', tone: 'success' },
  academic: { label: 'Academic', tone: 'neutral' },
  financial: { label: 'Financial', tone: 'beacon' },
  wellbeing: { label: 'Wellbeing', tone: 'brand' },
  other: { label: 'Other', tone: 'neutral' },
};

export const SESSION_CATEGORIES: Record<SessionCategory, string> = {
  academic: 'Academic pressure',
  social: 'Social / relationships',
  personal: 'Personal / family',
  wellbeing: 'Wellbeing / stress',
  financial: 'Financial',
  other: 'Other',
};

export const SESSION_OUTCOMES: Record<SessionOutcome, string> = {
  listened: 'Listened and supported',
  resolved: 'Peer felt it was resolved',
  referred: 'Referred to a service',
  follow_up: 'Follow-up planned',
  escalated: 'Escalated to coordinator',
};

export const MOODS = [
  { value: 1, emoji: '😞', label: 'Drained' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
] as const;

// Standard System Usability Scale items (Brooke, 1996), "system" → "Beacon".
export const SUS_ITEMS = [
  'I think that I would like to use Beacon frequently.',
  'I found Beacon unnecessarily complex.',
  'I thought Beacon was easy to use.',
  'I think that I would need the support of a technical person to be able to use Beacon.',
  'I found the various functions in Beacon were well integrated.',
  'I thought there was too much inconsistency in Beacon.',
  'I would imagine that most people would learn to use Beacon very quickly.',
  'I found Beacon very cumbersome to use.',
  'I felt very confident using Beacon.',
  'I needed to learn a lot of things before I could get going with Beacon.',
] as const;

export function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  return new Intl.DateTimeFormat('en-GB', opts).format(new Date(value));
}

/** Typed Object.entries for records with known keys. */
export function entries<K extends string, V>(record: Record<K, V>): [K, V][] {
  return Object.entries(record) as [K, V][];
}
