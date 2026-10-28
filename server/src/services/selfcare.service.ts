// Self-care & Reflection Service (FR7).
import * as db from '../db/pool';
import { encrypt, decrypt } from '../utils/crypto';
import { notFound } from '../utils/http-error';

export async function listReflections(userId: number) {
  const { rows } = await db.query<{ reflection_id: number; mood_rating: number; free_text_enc: string | null; created_at: Date }>(
    'SELECT * FROM reflections WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
    [userId],
  );
  return rows.map((r) => ({
    id: r.reflection_id,
    moodRating: r.mood_rating,
    freeText: decrypt(r.free_text_enc),
    createdAt: r.created_at,
  }));
}

export async function createReflection(userId: number, { moodRating, freeText }: { moodRating: number; freeText?: string }) {
  const { rows } = await db.query<{ reflection_id: number; created_at: Date }>(
    'INSERT INTO reflections (user_id, mood_rating, free_text_enc) VALUES ($1, $2, $3) RETURNING reflection_id, created_at',
    [userId, moodRating, encrypt(freeText)],
  );
  const row = rows[0]!;
  return { id: row.reflection_id, createdAt: row.created_at };
}

export async function deleteReflection(userId: number, reflectionId: number) {
  const { rowCount } = await db.query('DELETE FROM reflections WHERE reflection_id = $1 AND user_id = $2', [reflectionId, userId]);
  if (!rowCount) throw notFound('Reflection not found.');
}
