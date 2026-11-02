// Gamification Service: quizzes and badges (FR4).
//
// Quizzes are open at any time. A peer who already knows a topic can "test
// out": passing the quiz earns the badge without reading every section.
//
// Each module has a bank of questions; an attempt shows a few of them:
// - first:  the learner's first attempt (a fresh draw);
// - new:    a fresh draw, preferring questions this learner has seen least;
// - repeat: the same questions as last time, reshuffled, for practice.
// The server picks the questions and remembers them, so answers are always
// scored against what was actually shown. Correct answers never leave the
// server before submission. Only first and new attempts can earn the badge:
// passing a repeated set could just mean remembering it.
import * as db from '../db/pool';
import { findPublishedModule } from './training.service';
import { scoreQuiz, type QuizQuestion } from '../utils/scoring';
import { notFound, badRequest, conflict } from '../utils/http-error';
import { QuestionSelector, presentQuestion, type DrawnQuestion } from '../domain/question-selector';
import { QuizPaceSignal } from '../domain/learning-integrity';

export type AttemptMode = 'first' | 'new' | 'repeat';

/** A bank question. Older banks may lack ids; they get positional ids. */
interface BankQuestion extends QuizQuestion {
  id: string;
}

interface QuizRow {
  quiz_id: number;
  module_id: number;
  passing_score: number;
  questions_per_attempt: number;
  questions: QuizQuestion[];
}

const selector = new QuestionSelector();
const quizPace = new QuizPaceSignal();

const withIds = (questions: (QuizQuestion & { id?: string })[]): BankQuestion[] =>
  questions.map((question, i) => ({ ...question, id: question.id || `q${i + 1}` }));

async function loadQuiz(slug: string) {
  const mod = await findPublishedModule(slug);
  const { rows } = await db.query<QuizRow>('SELECT * FROM quizzes WHERE module_id = $1', [mod.module_id]);
  const quiz = rows[0];
  if (!quiz || quiz.questions.length === 0) throw notFound('This module does not have a quiz yet.');
  return { mod, quiz, bank: withIds(quiz.questions), perAttempt: Math.min(quiz.questions_per_attempt, quiz.questions.length) };
}

async function moduleCompleted(userId: number, moduleId: number) {
  const { rows } = await db.query<{ status: string }>('SELECT status FROM module_progress WHERE user_id = $1 AND module_id = $2', [
    userId,
    moduleId,
  ]);
  return rows[0]?.status === 'completed';
}

/** Quiz overview for the learner: their record so far, and how the quiz works. No questions. */
export async function getQuiz(slug: string, userId: number) {
  const { mod, quiz, bank, perAttempt } = await loadQuiz(slug);
  const [record, completed] = await Promise.all([
    db.query<{ best: number | null; attempts: number }>(
      `SELECT MAX(score)::int AS best, COUNT(*)::int AS attempts
       FROM quiz_attempts WHERE user_id = $1 AND module_id = $2 AND submitted_at IS NOT NULL`,
      [userId, mod.module_id],
    ),
    moduleCompleted(userId, mod.module_id),
  ]);
  const { best, attempts } = record.rows[0]!;
  return {
    module: { slug: mod.slug, title: mod.title },
    passingScore: quiz.passing_score,
    questionCount: perAttempt,
    bankSize: bank.length,
    bestScore: best,
    attempts,
    canRepeat: attempts > 0,
    // True when the learner is taking the quiz before reading the module.
    testOut: !completed,
  };
}

/** How often this learner has been shown each question of this module. */
async function timesSeen(userId: number, moduleId: number) {
  const { rows } = await db.query<{ id: string; seen: number }>(
    `SELECT q.id, COUNT(*)::int AS seen
     FROM quiz_attempts a, jsonb_array_elements_text(a.question_ids) AS q(id)
     WHERE a.user_id = $1 AND a.module_id = $2 AND a.submitted_at IS NOT NULL
     GROUP BY q.id`,
    [userId, moduleId],
  );
  return new Map(rows.map((r) => [r.id, r.seen]));
}

/**
 * Start an attempt: pick the questions, remember them, and return them
 * without answers. Options are shown in a shuffled order.
 */
export async function startAttempt(slug: string, userId: number, requested: 'new' | 'repeat') {
  const { mod, quiz, bank, perAttempt } = await loadQuiz(slug);
  const { rows: last } = await db.query<{ question_ids: string[] }>(
    `SELECT question_ids FROM quiz_attempts
     WHERE user_id = $1 AND module_id = $2 AND submitted_at IS NOT NULL
     ORDER BY submitted_at DESC LIMIT 1`,
    [userId, mod.module_id],
  );
  const previous = last[0];

  let mode: AttemptMode;
  let drawn: DrawnQuestion[];
  if (!previous) {
    mode = 'first';
    drawn = selector.drawNew(bank, perAttempt);
  } else if (requested === 'repeat') {
    mode = 'repeat';
    drawn = selector.redraw(bank, previous.question_ids);
    if (drawn.length === 0) drawn = selector.drawNew(bank, perAttempt); // the old questions were removed from the bank
  } else {
    mode = 'new';
    drawn = selector.drawNew(bank, perAttempt, await timesSeen(userId, mod.module_id));
  }

  // Unsubmitted attempts older than a day are abandoned; tidy them away.
  await db.query(
    `DELETE FROM quiz_attempts WHERE user_id = $1 AND module_id = $2 AND submitted_at IS NULL AND started_at < now() - interval '1 day'`,
    [userId, mod.module_id],
  );
  const { rows } = await db.query<{ attempt_id: number }>(
    `INSERT INTO quiz_attempts (user_id, module_id, mode, question_ids, option_orders)
     VALUES ($1, $2, $3, $4, $5) RETURNING attempt_id`,
    [userId, mod.module_id, mode, JSON.stringify(drawn.map((d) => d.id)), JSON.stringify(drawn.map((d) => d.order))],
  );

  const byId = new Map(bank.map((question) => [question.id, question]));
  return {
    attemptId: rows[0]!.attempt_id,
    mode,
    passingScore: quiz.passing_score,
    canEarnBadge: mode !== 'repeat',
    questions: drawn.map((d, index) => ({ index, prompt: byId.get(d.id)!.prompt, options: presentQuestion(byId.get(d.id)!, d.order).options })),
  };
}

/** Score an attempt, store it, and award the module badge on the first pass of a fresh set of questions. */
export async function submitAttempt(attemptId: number, userId: number, answers: number[]) {
  return db.withTransaction(async (client) => {
    // FOR UPDATE: two quick submits of the same attempt cannot both be scored.
    const { rows } = await client.query<{
      module_id: number;
      mode: AttemptMode;
      question_ids: string[];
      option_orders: number[][];
      submitted_at: Date | null;
      seconds: number;
    }>(
      `SELECT module_id, mode, question_ids, option_orders, submitted_at,
              EXTRACT(EPOCH FROM now() - started_at)::int AS seconds
       FROM quiz_attempts WHERE attempt_id = $1 AND user_id = $2 FOR UPDATE`,
      [attemptId, userId],
    );
    const attempt = rows[0];
    if (!attempt) throw notFound('That quiz attempt was not found.');
    if (attempt.submitted_at) throw conflict('This quiz has already been submitted. Start a new one to try again.');
    if (answers.length !== attempt.question_ids.length) {
      throw badRequest(`Please answer all ${attempt.question_ids.length} questions.`);
    }

    const { rows: modRows } = await client.query<{ slug: string; title: string; passing_score: number; questions: QuizQuestion[] }>(
      `SELECT m.slug, m.title, q.passing_score, q.questions
       FROM training_modules m JOIN quizzes q ON q.module_id = m.module_id WHERE m.module_id = $1`,
      [attempt.module_id],
    );
    const mod = modRows[0];
    if (!mod) throw notFound('This module does not have a quiz any more.');
    const byId = new Map(withIds(mod.questions).map((question) => [question.id, question]));
    const shown = attempt.question_ids.map((id, i) => {
      const question = byId.get(id);
      if (!question) throw conflict('This quiz changed while you were taking it. Please start it again.');
      return presentQuestion(question, attempt.option_orders[i]!);
    });

    const result = scoreQuiz(shown, answers, mod.passing_score);
    const pace = quizPace.evaluate({ questionCount: shown.length }, attempt.seconds);
    const completed = await client.query<{ status: string }>('SELECT status FROM module_progress WHERE user_id = $1 AND module_id = $2', [
      userId,
      attempt.module_id,
    ]);
    const testedOut = completed.rows[0]?.status !== 'completed';

    await client.query('UPDATE quiz_attempts SET score = $1, passed = $2, rushed = $3, submitted_at = now() WHERE attempt_id = $4', [
      result.score,
      result.passed,
      pace.rushed,
      attemptId,
    ]);

    const canEarnBadge = attempt.mode !== 'repeat';
    let badge: { title: string; earnedAt: Date; isNew: true } | null = null;
    if (result.passed && canEarnBadge) {
      const inserted = await client.query<{ title: string; earned_at: Date }>(
        `INSERT INTO badges (user_id, module_id, type, title) VALUES ($1, $2, 'module_mastery', $3)
         ON CONFLICT (user_id, module_id, type) DO NOTHING RETURNING title, earned_at`,
        [userId, attempt.module_id, `${mod.title} Badge`],
      );
      const row = inserted.rows[0];
      if (row) badge = { title: row.title, earnedAt: row.earned_at, isNew: true };
    }
    return {
      ...result,
      mode: attempt.mode,
      canEarnBadge,
      rushed: pace.rushed,
      passingScore: mod.passing_score,
      badge,
      testedOut: testedOut && result.passed && canEarnBadge,
      // The questions as shown, so the review can display them.
      questions: shown.map((question) => ({ prompt: question.prompt, options: question.options })),
    };
  });
}
