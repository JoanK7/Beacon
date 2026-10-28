// Feedback Service (FR8). Responses carry no user identifier.
import * as db from '../db/pool';
import { calculateSus } from '../utils/scoring';

export async function submitFeedback({ susAnswers, comment }: { susAnswers: number[]; comment?: string }) {
  const susScore = calculateSus(susAnswers);
  await db.query('INSERT INTO feedback (sus_answers, sus_score, comment) VALUES ($1, $2, $3)', [susAnswers, susScore, comment || null]);
  return { susScore };
}
