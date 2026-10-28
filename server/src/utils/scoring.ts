// Pure scoring logic, kept free of I/O so it is easy to unit test.

export interface QuizQuestion {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}

export interface QuestionResult {
  question: number;
  chosen: number | null;
  correctIndex: number;
  correct: boolean;
  explanation: string;
}

export interface QuizScore {
  score: number;
  passed: boolean;
  correctCount: number;
  total: number;
  results: QuestionResult[];
}

/**
 * Score a quiz. `answers[i]` is the option index chosen for question i.
 * Returns a percentage score plus per-question feedback for the learner.
 */
export function scoreQuiz(questions: QuizQuestion[], answers: number[], passingScore: number): QuizScore {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Quiz has no questions');
  }
  const results = questions.map((q, i): QuestionResult => {
    const answer = answers[i];
    const chosen = Number.isInteger(answer) ? (answer as number) : null;
    return {
      question: i,
      chosen,
      correctIndex: q.answerIndex,
      correct: chosen === q.answerIndex,
      explanation: q.explanation || '',
    };
  });
  const correctCount = results.filter((r) => r.correct).length;
  const score = Math.round((correctCount / questions.length) * 100);
  return { score, passed: score >= passingScore, correctCount, total: questions.length, results };
}

/**
 * System Usability Scale (Brooke, 1996). Ten answers on a 1–5 scale.
 * Odd items are positively worded (answer − 1), even items negatively (5 − answer).
 * The sum (0–40) is multiplied by 2.5 to give a 0–100 score.
 */
export function calculateSus(answers: number[]): number {
  if (!Array.isArray(answers) || answers.length !== 10) {
    throw new Error('SUS requires exactly 10 answers');
  }
  const sum = answers.reduce((acc, value, i) => {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error('SUS answers must be integers from 1 to 5');
    }
    return acc + (i % 2 === 0 ? value - 1 : 5 - value);
  }, 0);
  return sum * 2.5;
}

// Points reward learning activity only. Logging support sessions is deliberately
// NOT gamified so there is never an incentive to inflate session counts.
export const POINTS = { sectionViewed: 10, moduleCompleted: 50, badgeEarned: 100, scenarioCompleted: 40 } as const;

export const LEVELS = [
  { name: 'Newcomer', min: 0 },
  { name: 'Listener', min: 120 },
  { name: 'Supporter', min: 350 },
  { name: 'Guide', min: 650 },
  { name: 'Beacon', min: 1000 }, // reachable by completing all six seeded modules
] as const;

export interface PointInputs {
  sectionsViewed?: number;
  modulesCompleted?: number;
  badgesEarned?: number;
  scenariosCompleted?: number;
}

export function calculatePoints({ sectionsViewed = 0, modulesCompleted = 0, badgesEarned = 0, scenariosCompleted = 0 }: PointInputs): number {
  return (
    sectionsViewed * POINTS.sectionViewed +
    modulesCompleted * POINTS.moduleCompleted +
    badgesEarned * POINTS.badgeEarned +
    scenariosCompleted * POINTS.scenarioCompleted
  );
}

export interface LevelInfo {
  level: number;
  name: string;
  nextLevelAt: number | null;
  progressToNext: number;
}

/** Current level plus how far the learner is towards the next one. */
export function levelForPoints(points: number): LevelInfo {
  let index = 0;
  LEVELS.forEach((level, i) => {
    if (points >= level.min) index = i;
  });
  const current = LEVELS[index]!;
  const next = LEVELS[index + 1] ?? null;
  const progress = next ? Math.round(((points - current.min) / (next.min - current.min)) * 100) : 100;
  return { level: index + 1, name: current.name, nextLevelAt: next ? next.min : null, progressToNext: progress };
}
