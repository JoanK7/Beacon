// Skill check: a short placement test across all modules.
//
// - Taken at first login ('pre'), it shows each peer's strengths and gaps per
//   competency, so they can focus on the modules they actually need.
// - Retaken at the end of the pilot ('post'), it gives the before/after
//   knowledge measure for the study (RQ3).
// It reuses the first two quiz questions of each published module, so there is
// one question bank to maintain. Answers are hidden while taking the check;
// after submitting, the peer sees a review of their own answers (what they got
// right or wrong, the correct answer and why) so they can learn from it.
import * as db from '../db/pool';
import { badRequest } from '../utils/http-error';
import type { QuizQuestion } from '../utils/scoring';

const QUESTIONS_PER_MODULE = 2;

interface BankQuestion {
  id: string;
  moduleSlug: string;
  moduleTitle: string;
  topic: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

/** One answered question, shown back to the peer after the check. */
export interface SkillReviewItem {
  prompt: string;
  options: string[];
  chosen: number;
  correctIndex: number;
  correct: boolean;
  explanation: string;
}

export interface SkillResult {
  slug: string;
  title: string;
  topic: string;
  correct: number;
  total: number;
  level: 'strong' | 'practise';
  /** Stored with the attempt so the review matches what was asked, even if content changes later. */
  questions: SkillReviewItem[];
}

async function questionBank(): Promise<BankQuestion[]> {
  const { rows } = await db.query<{ slug: string; title: string; topic: string; questions: QuizQuestion[] }>(
    `SELECT m.slug, m.title, m.topic, q.questions
     FROM training_modules m JOIN quizzes q ON q.module_id = m.module_id
     WHERE m.status = 'published' ORDER BY m.order_index, m.module_id`,
  );
  return rows.flatMap((m) =>
    m.questions.slice(0, QUESTIONS_PER_MODULE).map((q, i) => ({
      id: `${m.slug}:${i}`,
      moduleSlug: m.slug,
      moduleTitle: m.title,
      topic: m.topic,
      prompt: q.prompt,
      options: q.options,
      answerIndex: q.answerIndex,
      explanation: q.explanation ?? '',
    })),
  );
}

async function latestAttempts(userId: number) {
  const { rows } = await db.query<{ kind: 'pre' | 'post'; score: number; results: SkillResult[]; created_at: Date }>(
    `SELECT DISTINCT ON (kind) kind, score, results, created_at
     FROM skill_check_attempts WHERE user_id = $1 ORDER BY kind, created_at DESC`,
    [userId],
  );
  const toSummary = (r: (typeof rows)[number] | undefined) =>
    r ? { score: r.score, results: r.results, takenAt: r.created_at } : null;
  return { pre: toSummary(rows.find((r) => r.kind === 'pre')), post: toSummary(rows.find((r) => r.kind === 'post')) };
}

/** Questions (without answers) plus the caller's latest pre/post results. */
export async function getSkillCheck(userId: number) {
  const [bank, latest] = await Promise.all([questionBank(), latestAttempts(userId)]);
  return {
    questions: bank.map(({ answerIndex: _answer, explanation: _why, ...q }) => q),
    latest,
  };
}

export async function submitSkillCheck(userId: number, kind: 'pre' | 'post', answers: { questionId: string; answer: number }[]) {
  const bank = await questionBank();
  const given = new Map(answers.map((a) => [a.questionId, a.answer]));
  const unanswered = bank.filter((q) => !given.has(q.id));
  if (unanswered.length) throw badRequest(`Please answer all ${bank.length} questions.`);

  const byModule = new Map<string, SkillResult>();
  for (const q of bank) {
    const entry: SkillResult = byModule.get(q.moduleSlug) ?? {
      slug: q.moduleSlug,
      title: q.moduleTitle,
      topic: q.topic,
      correct: 0,
      total: 0,
      level: 'practise',
      questions: [],
    };
    const chosen = given.get(q.id)!;
    const correct = chosen === q.answerIndex;
    entry.total += 1;
    if (correct) entry.correct += 1;
    entry.questions.push({ prompt: q.prompt, options: q.options, chosen, correctIndex: q.answerIndex, correct, explanation: q.explanation });
    byModule.set(q.moduleSlug, entry);
  }
  const results = [...byModule.values()].map((r) => ({ ...r, level: r.correct === r.total ? ('strong' as const) : ('practise' as const) }));
  const correct = results.reduce((n, r) => n + r.correct, 0);
  const score = Math.round((correct / bank.length) * 100);

  await db.query('INSERT INTO skill_check_attempts (user_id, kind, score, results) VALUES ($1, $2, $3, $4)', [
    userId,
    kind,
    score,
    JSON.stringify(results),
  ]);
  return { kind, score, results };
}
