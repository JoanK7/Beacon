// Chooses which quiz questions a learner sees, and in what order.
//
// Why: with one fixed set of questions, a learner can pass by repeating the
// quiz and memorising answers. Drawing a few questions from a larger bank,
// preferring the ones this learner has seen least, means a "new quiz" really
// tests different knowledge. Options are shuffled too, so remembering
// "it was the second one" does not help.

/** A source of random numbers in [0, 1). Injected so tests can be deterministic. */
export type Random = () => number;

/**
 * Small seeded random number generator (mulberry32). Used in tests so a
 * "random" draw is reproducible; production uses Math.random.
 */
export function seededRandom(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BankQuestion {
  id: string;
  options: string[];
  answerIndex: number;
}

/** One question as drawn for an attempt: which question, and the order its options are shown in. */
export interface DrawnQuestion {
  id: string;
  /** order[p] = index of the original option shown at position p. */
  order: number[];
}

export class QuestionSelector {
  constructor(private readonly random: Random = Math.random) {}

  /** Fisher–Yates shuffle: every ordering is equally likely, in O(n). Returns a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy;
  }

  /** A random order for a question's options. */
  optionOrder(optionCount: number): number[] {
    return this.shuffle(Array.from({ length: optionCount }, (_, i) => i));
  }

  /**
   * Draw `count` questions, preferring those this learner has seen least.
   * Questions are shuffled first, so ties (same number of views) are broken
   * at random; a stable sort by view count then keeps that random order
   * within each group. O(n log n) for a bank of n questions.
   */
  drawNew<Q extends BankQuestion>(bank: readonly Q[], count: number, timesSeen: ReadonlyMap<string, number> = new Map()): DrawnQuestion[] {
    const picked = this.shuffle(bank)
      .sort((a, b) => (timesSeen.get(a.id) ?? 0) - (timesSeen.get(b.id) ?? 0))
      .slice(0, Math.min(count, bank.length));
    return picked.map((question) => ({ id: question.id, order: this.optionOrder(question.options.length) }));
  }

  /** The same questions as a previous attempt, with questions and options reshuffled. */
  redraw<Q extends BankQuestion>(bank: readonly Q[], previousIds: readonly string[]): DrawnQuestion[] {
    const byId = new Map(bank.map((question) => [question.id, question]));
    const stillInBank = previousIds.filter((id) => byId.has(id));
    return this.shuffle(stillInBank).map((id) => ({ id, order: this.optionOrder(byId.get(id)!.options.length) }));
  }
}

/**
 * Present a bank question in the drawn order: options rearranged and the
 * correct answer's position moved to match. Pure, so scoring can use it.
 */
export function presentQuestion<Q extends BankQuestion>(question: Q, order: readonly number[]): Q {
  return {
    ...question,
    options: order.map((original) => question.options[original]!),
    answerIndex: order.indexOf(question.answerIndex),
  };
}
