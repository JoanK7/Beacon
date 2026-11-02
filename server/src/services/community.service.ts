// Community wall: peers share how they feel, anonymously, so others can
// notice and offer support (peer supporters get drained too).
//
// Privacy and safety by design:
// - No username or user id ever leaves this service. Authors see their own
//   posts marked "mine"; times are rounded to the hour, so a post cannot be
//   matched to someone by the exact minute it appeared.
// - Posts leave the wall after 7 days.
// - Replies are a fixed set of kind messages, never free text, so the wall
//   cannot be used to hurt anyone.
// - Notes that may mention risk to life are flagged: the author is shown
//   urgent help straight away and readers see a prompt to reach out to the
//   Wellness team. Flagged posts are not blocked.
// - Three reports hide a post until an admin reviews it.
import * as db from '../db/pool';
import { badRequest, conflict, notFound } from '../utils/http-error';
import { CrisisDetector } from '../domain/crisis-detector';

export const SUPPORT_KINDS = ['hug', 'here_for_you', 'you_got_this', 'reach_out'] as const;
export type SupportKind = (typeof SUPPORT_KINDS)[number];

export const WALL_DAYS = 7;
export const POSTS_PER_DAY = 5;
export const REPORTS_TO_HIDE = 3;

const detector = new CrisisDetector();

interface PostRow {
  post_id: number;
  mood: number;
  note: string;
  needs_care: boolean;
  posted_hour: Date;
  mine: boolean;
  supports: Partial<Record<SupportKind, number>> | null;
  my_supports: SupportKind[] | null;
  reported_by_me: boolean;
}

const toPost = (r: PostRow) => ({
  id: r.post_id,
  mood: r.mood,
  note: r.note,
  needsCare: r.needs_care,
  postedAt: r.posted_hour,
  mine: r.mine,
  supports: Object.fromEntries(SUPPORT_KINDS.map((k) => [k, r.supports?.[k] ?? 0])) as Record<SupportKind, number>,
  mySupports: r.my_supports ?? [],
  reportedByMe: r.reported_by_me,
});

const POST_SELECT = `
  SELECT p.post_id, p.mood, p.note, p.needs_care, date_trunc('hour', p.created_at) AS posted_hour,
         (p.user_id = $1) AS mine,
         (SELECT jsonb_object_agg(kind, n) FROM (SELECT kind, COUNT(*)::int AS n FROM mood_supports s
            WHERE s.post_id = p.post_id GROUP BY kind) k) AS supports,
         (SELECT array_agg(kind) FROM mood_supports s WHERE s.post_id = p.post_id AND s.user_id = $1) AS my_supports,
         EXISTS (SELECT 1 FROM mood_reports r WHERE r.post_id = p.post_id AND r.user_id = $1) AS reported_by_me
  FROM mood_posts p`;

/** Recent visible posts, newest first. */
export async function listPosts(userId: number) {
  const { rows } = await db.query<PostRow>(
    `${POST_SELECT}
     WHERE NOT p.hidden AND p.created_at > now() - make_interval(days => ${WALL_DAYS})
     ORDER BY p.created_at DESC LIMIT 60`,
    [userId],
  );
  return rows.map(toPost);
}

async function getPost(userId: number, postId: number) {
  const { rows } = await db.query<PostRow>(`${POST_SELECT} WHERE p.post_id = $2`, [userId, postId]);
  if (!rows[0]) throw notFound('That post is no longer on the wall.');
  return toPost(rows[0]);
}

export async function createPost(userId: number, mood: number, note: string) {
  const { rows: recent } = await db.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM mood_posts WHERE user_id = $1 AND created_at > now() - interval '1 day'`,
    [userId],
  );
  if (recent[0]!.count >= POSTS_PER_DAY) {
    throw badRequest(`You can share up to ${POSTS_PER_DAY} times a day. If you need to talk now, the Urgent help page has people ready to listen.`);
  }
  const { needsCare } = detector.check(note);
  const { rows } = await db.query<{ post_id: number }>(
    'INSERT INTO mood_posts (user_id, mood, note, needs_care) VALUES ($1, $2, $3, $4) RETURNING post_id',
    [userId, mood, note, needsCare],
  );
  return getPost(userId, rows[0]!.post_id);
}

export async function deletePost(userId: number, postId: number) {
  const { rowCount } = await db.query('DELETE FROM mood_posts WHERE post_id = $1 AND user_id = $2', [postId, userId]);
  if (!rowCount) throw notFound('Post not found.');
}

async function assertVisible(postId: number) {
  const { rowCount } = await db.query(
    `SELECT 1 FROM mood_posts WHERE post_id = $1 AND NOT hidden AND created_at > now() - make_interval(days => ${WALL_DAYS})`,
    [postId],
  );
  if (!rowCount) throw notFound('That post is no longer on the wall.');
}

/** Send a kind message, or take it back if already sent (a toggle). */
export async function toggleSupport(userId: number, postId: number, kind: SupportKind) {
  await assertVisible(postId);
  const removed = await db.query('DELETE FROM mood_supports WHERE post_id = $1 AND user_id = $2 AND kind = $3', [postId, userId, kind]);
  if (!removed.rowCount) {
    await db.query('INSERT INTO mood_supports (post_id, user_id, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [postId, userId, kind]);
  }
  return getPost(userId, postId);
}

/** Report a post. Enough reports hide it until an admin reviews it (unless an admin already cleared it). */
export async function reportPost(userId: number, postId: number) {
  await assertVisible(postId);
  return db.withTransaction(async (client) => {
    const own = await client.query('SELECT 1 FROM mood_posts WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    if (own.rowCount) throw conflict('You cannot report your own post. You can delete it instead.');
    await client.query('INSERT INTO mood_reports (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [postId, userId]);
    const { rows } = await client.query<{ hidden: boolean }>(
      `UPDATE mood_posts SET hidden = true
       WHERE post_id = $1 AND NOT admin_cleared AND (SELECT COUNT(*) FROM mood_reports WHERE post_id = $1) >= $2
       RETURNING hidden`,
      [postId, REPORTS_TO_HIDE],
    );
    return { hidden: Boolean(rows[0]?.hidden) };
  });
}

// Moderation (admins) --------------------------------------------------------

/** Posts that were reported or hidden, for an admin to review. Still anonymous. */
export async function listForModeration() {
  const { rows } = await db.query<{
    post_id: number;
    mood: number;
    note: string;
    needs_care: boolean;
    hidden: boolean;
    admin_cleared: boolean;
    reports: number;
    created_at: Date;
  }>(
    `SELECT p.post_id, p.mood, p.note, p.needs_care, p.hidden, p.admin_cleared, p.created_at,
            (SELECT COUNT(*) FROM mood_reports r WHERE r.post_id = p.post_id)::int AS reports
     FROM mood_posts p
     WHERE p.hidden OR EXISTS (SELECT 1 FROM mood_reports r WHERE r.post_id = p.post_id) OR p.needs_care
     ORDER BY p.created_at DESC LIMIT 100`,
  );
  return rows.map((r) => ({
    id: r.post_id,
    mood: r.mood,
    note: r.note,
    needsCare: r.needs_care,
    hidden: r.hidden,
    adminCleared: r.admin_cleared,
    reports: r.reports,
    createdAt: r.created_at,
  }));
}

/** Hide a post, or restore it (a restored post can no longer be hidden by reports). */
export async function setPostHidden(postId: number, hidden: boolean) {
  const { rowCount } = await db.query('UPDATE mood_posts SET hidden = $1, admin_cleared = (NOT $1) WHERE post_id = $2', [hidden, postId]);
  if (!rowCount) throw notFound('Post not found.');
}
