// Daily stories: one short, illustrative story of peer support each day, to
// motivate peers. Reading a story for the first time earns points.
import * as db from '../db/pool';
import { notFound } from '../utils/http-error';
import { POINTS } from '../utils/scoring';
import { dayNumber } from '../domain/streak';
import { LOCAL_TODAY_SQL } from '../utils/local-time';

interface StoryRow {
  story_id: number;
  slug: string;
  title: string;
  body: string;
  reflection: string;
  module_slug: string | null;
  module_title: string | null;
  read_at: Date | null;
}

const toStory = (r: StoryRow) => ({
  id: r.story_id,
  slug: r.slug,
  title: r.title,
  body: r.body,
  reflection: r.reflection,
  module: r.module_slug && r.module_title ? { slug: r.module_slug, title: r.module_title } : null,
  read: r.read_at !== null,
  readAt: r.read_at,
});

const STORY_SELECT = `
  SELECT s.story_id, s.slug, s.title, s.body, s.reflection, s.module_slug, m.title AS module_title, r.read_at
  FROM stories s
  LEFT JOIN training_modules m ON m.slug = s.module_slug AND m.status = 'published'
  LEFT JOIN story_reads r ON r.story_id = s.story_id AND r.user_id = $1`;

/**
 * Today's story plus the full list. Every peer sees the same story on the
 * same day: the day number (in Kigali) modulo the number of stories, so the
 * stories rotate without anything to schedule.
 */
export async function listStories(userId: number) {
  const [{ rows }, today] = await Promise.all([
    db.query<StoryRow>(`${STORY_SELECT} ORDER BY s.order_index, s.story_id`, [userId]),
    db.query<{ today: string }>(`SELECT ${LOCAL_TODAY_SQL} AS today`),
  ]);
  const stories = rows.map(toStory);
  const todays = stories.length ? stories[dayNumber(today.rows[0]!.today) % stories.length]! : null;
  return { today: todays, stories, pointsPerStory: POINTS.storyRead };
}

export async function getStory(slug: string, userId: number) {
  const { rows } = await db.query<StoryRow>(`${STORY_SELECT} WHERE s.slug = $2`, [userId, slug]);
  if (!rows[0]) throw notFound('That story was not found.');
  return toStory(rows[0]);
}

/** Mark a story as read. Points are earned only the first time. */
export async function markStoryRead(slug: string, userId: number) {
  const story = await getStory(slug, userId);
  const { rowCount } = await db.query('INSERT INTO story_reads (user_id, story_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, story.id]);
  const firstRead = Boolean(rowCount);
  return { firstRead, pointsEarned: firstRead ? POINTS.storyRead : 0 };
}
