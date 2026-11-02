// Spots notes on the community wall that may mention risk to life, so the
// author is shown urgent help straight away and readers see a gentle prompt
// to reach out to the Wellness team.
//
// It is a safety net, not a diagnosis: a simple phrase list will miss some
// posts and flag a few harmless ones. A flagged post is never blocked (that
// could silence someone asking for help); it is shown with care instead.

const PATTERNS: readonly RegExp[] = [
  /\bsuicid/i,
  /\bkill(ing)? my ?self\b/i,
  /\bend(ing)? (it all|my life)\b/i,
  /\b(want|wanted|wish) to die\b/i,
  /\bdon'?t want to (live|be alive|be here)\b/i,
  /\bno (reason|point) (to|in) (live|living|going on)\b/i,
  /\bself[- ]?harm/i,
  /\bhurt(ing)? my ?self\b/i,
  /\bcut(ting)? my ?self\b/i,
  /\bbetter off without me\b/i,
  /\bcan'?t go on\b/i,
];

export interface CrisisCheck {
  needsCare: boolean;
  /** The phrases that matched (for tests and moderation, never shown to readers). */
  matches: string[];
}

export class CrisisDetector {
  constructor(private readonly patterns: readonly RegExp[] = PATTERNS) {}

  check(text: string): CrisisCheck {
    // Treat curly apostrophes like straight ones, so "don’t" matches "don't".
    const normalised = text.replace(/[‘’]/g, "'");
    const matches = this.patterns.map((p) => normalised.match(p)?.[0]).filter((m): m is string => Boolean(m));
    return { needsCare: matches.length > 0, matches };
  }
}
