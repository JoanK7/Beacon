// Signs that a learner rushed instead of learning.
//
// Beacon never blocks anyone (a low-pressure design), but it does measure:
// - a lesson section marked as read far faster than it could be read, and
// - a quiz answered faster than the questions could be read.
// Rushed reading earns no points, the learner gets a kind nudge, and the
// coordinator sees the cohort's rush rate. Times are measured on the server,
// so the browser cannot fake them.
//
// PaceSignal is a small template: each subclass only says how long the work
// should take; the shared evaluate() turns that into a verdict.

export interface PaceResult {
  /** How long the work would take at a normal pace, in seconds. */
  expectedSeconds: number;
  /** Anything faster than this counts as rushed. */
  thresholdSeconds: number;
  actualSeconds: number;
  rushed: boolean;
}

export abstract class PaceSignal<T> {
  /**
   * @param fraction  share of the expected time below which work counts as rushed
   * @param floorSeconds  the threshold is never lower than this
   */
  protected constructor(
    private readonly fraction: number,
    private readonly floorSeconds: number,
  ) {}

  /** How long `work` should take at a normal pace, in seconds. */
  protected abstract expectedSeconds(work: T): number;

  evaluate(work: T, actualSeconds: number): PaceResult {
    const expectedSeconds = Math.round(this.expectedSeconds(work));
    const thresholdSeconds = Math.max(this.floorSeconds, Math.round(expectedSeconds * this.fraction));
    return { expectedSeconds, thresholdSeconds, actualSeconds, rushed: actualSeconds < thresholdSeconds };
  }
}

/** Words in a lesson body, ignoring the lesson markup symbols. */
export function countWords(body: string): number {
  return body
    .replace(/\*\*|^[>+?=\-]+|\[[ x]\]|\|/gm, ' ')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/**
 * A lesson section. Expected time = words ÷ 200 words per minute (a typical
 * reading speed). Reading in under a quarter of that, or under 8 seconds,
 * is rushed: even a fast skim-reader takes longer.
 */
export class ReadingPaceSignal extends PaceSignal<{ body: string }> {
  static readonly WORDS_PER_MINUTE = 200;

  constructor() {
    super(0.25, 8);
  }

  protected expectedSeconds({ body }: { body: string }) {
    return (countWords(body) / ReadingPaceSignal.WORDS_PER_MINUTE) * 60;
  }
}

/** A quiz attempt. Reading and answering a question takes at least ~6 seconds. */
export class QuizPaceSignal extends PaceSignal<{ questionCount: number }> {
  static readonly SECONDS_PER_QUESTION = 6;

  constructor() {
    super(1, 0);
  }

  protected expectedSeconds({ questionCount }: { questionCount: number }) {
    return questionCount * QuizPaceSignal.SECONDS_PER_QUESTION;
  }
}

/**
 * Normalised learning gain (Hake, 1998): the share of the possible
 * improvement that was actually achieved between the skill check before and
 * after training. 0 = no change, 1 = from the starting score to 100%,
 * negative = scored lower. Returns null when the first score was already
 * 100%, where no improvement is possible.
 */
export function normalisedGain(pre: number, post: number): number | null {
  if (pre >= 100) return null;
  return Math.round(((post - pre) / (100 - pre)) * 100) / 100;
}
