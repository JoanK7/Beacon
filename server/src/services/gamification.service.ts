// Gamification Service: quizzes and badges (FR4).
//
// Quizzes are open at any time. A peer who already knows a topic can "test
// out": passing the quiz earns the badge without reading every section, so
// nobody is forced through content they are already proficient in.
import * as db from '../db/pool';
import { findPublishedModule } from './training.service';
import { scoreQuiz, type QuizQuestion } from '../utils/scoring';
import { notFound, badRequest } from '../utils/http-error';

interface QuizRow {
  quiz_id: number;
  module_id: number;
  passing_score: number;
  questions: QuizQuestion[];
}

async function loadQuiz(slug: string) {
  const mod = await findPublishedModule(slug);
  const { rows } = await db.query<QuizRow>('SELECT * FROM quizzes WHERE module_id = $1', [mod.module_id]);
  if (!rows[0]) throw notFound('This module does not have a quiz yet.');
  return { mod, quiz: rows[0] };
}

async function moduleCompleted(userId: number, moduleId: number) {
  const { rows } = await db.query<{ status: string }>('SELECT status FROM module_progress WHERE user_id = $1 AND module_id = $2', [
    userId,
    moduleId,
  ]);
  return rows[0]?.status === 'completed';
}

/** Questions for the learner. Correct answers never leave the server. */
export async function getQuiz(slug: string, userId: number) {
  const { mod, quiz } = await loadQuiz(slug);
  const [best, completed] = await Promise.all([
    db.query<{ best: number | null; attempts: number }>(
      'SELECT MAX(score)::int AS best, COUNT(*)::int AS attempts FROM quiz_attempts WHERE user_id = $1 AND module_id = $2',
      [userId, mod.module_id],
    ),
    moduleCompleted(userId, mod.module_id),
  ]);
  return {
    module: { slug: mod.slug, title: mod.title },
    passingScore: quiz.passing_score,
    bestScore: best.rows[0]!.best,
    attempts: best.rows[0]!.attempts,
    // True when the learner is taking the quiz before reading the module.
    testOut: !completed,
    questions: quiz.questions.map((q, i) => ({ index: i, prompt: q.prompt, options: q.options })),
  };
}

/** Score an attempt, store it, and award the module badge on first pass. */
export async function submitQuiz(slug: string, userId: number, answers: number[]) {
  const { mod, quiz } = await loadQuiz(slug);
  if (answers.length !== quiz.questions.length) {
    throw badRequest(`Please answer all ${quiz.questions.length} questions.`);
  }
  const result = scoreQuiz(quiz.questions, answers, quiz.passing_score);
  const testedOut = !(await moduleCompleted(userId, mod.module_id));

  return db.withTransaction(async (client) => {
    await client.query('INSERT INTO quiz_attempts (user_id, module_id, score, passed) VALUES ($1, $2, $3, $4)', [
      userId,
      mod.module_id,
      result.score,
      result.passed,
    ]);

    let badge: { title: string; earnedAt: Date; isNew: true } | null = null;
    if (result.passed) {
      const inserted = await client.query<{ title: string; earned_at: Date }>(
        `INSERT INTO badges (user_id, module_id, type, title) VALUES ($1, $2, 'module_mastery', $3)
         ON CONFLICT (user_id, module_id, type) DO NOTHING RETURNING title, earned_at`,
        [userId, mod.module_id, `${mod.title} Badge`],
      );
      const row = inserted.rows[0];
      if (row) badge = { title: row.title, earnedAt: row.earned_at, isNew: true };
    }
    return { ...result, passingScore: quiz.passing_score, badge, testedOut: testedOut && result.passed };
  });
}
