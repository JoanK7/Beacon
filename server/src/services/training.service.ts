// Training Module Service (FR2, FR3).
import * as db from '../db/pool';
import { notFound } from '../utils/http-error';
import { ReadingPaceSignal } from '../domain/learning-integrity';

const readingPace = new ReadingPaceSignal();

export interface ModuleRow {
  module_id: number;
  slug: string;
  title: string;
  topic: string;
  summary: string;
  order_index: number;
  estimated_minutes: number;
  status: string;
  content_verified: boolean;
  source_note: string | null;
}

type ModuleStatus = 'not_started' | 'in_progress' | 'completed';

/** Published modules in learning order, annotated with the caller's progress. */
export async function listModules(userId: number) {
  const { rows } = await db.query<{
    module_id: number;
    slug: string;
    title: string;
    topic: string;
    summary: string;
    estimated_minutes: number;
    content_verified: boolean;
    section_count: number;
    sections_viewed: number;
    status: ModuleStatus;
    has_badge: boolean;
    scenario_count: number;
  }>(
    `SELECT m.module_id, m.slug, m.title, m.topic, m.summary, m.order_index,
            m.estimated_minutes, m.content_verified,
            COUNT(DISTINCT s.section_id)::int AS section_count,
            COUNT(DISTINCT v.section_id)::int AS sections_viewed,
            COALESCE(p.status, 'not_started') AS status,
            EXISTS (SELECT 1 FROM badges b WHERE b.user_id = $1 AND b.module_id = m.module_id) AS has_badge,
            (SELECT COUNT(*) FROM scenarios sc WHERE sc.module_id = m.module_id AND sc.status = 'published')::int AS scenario_count
     FROM training_modules m
     LEFT JOIN module_sections s ON s.module_id = m.module_id
     LEFT JOIN section_views v ON v.section_id = s.section_id AND v.user_id = $1
     LEFT JOIN module_progress p ON p.module_id = m.module_id AND p.user_id = $1
     WHERE m.status = 'published'
     GROUP BY m.module_id, p.status
     ORDER BY m.order_index, m.module_id`,
    [userId],
  );
  return rows.map((r) => ({
    id: r.module_id,
    slug: r.slug,
    title: r.title,
    topic: r.topic,
    summary: r.summary,
    estimatedMinutes: r.estimated_minutes,
    contentVerified: r.content_verified,
    sectionCount: r.section_count,
    sectionsViewed: r.sections_viewed,
    status: r.status,
    hasBadge: r.has_badge,
    scenarioCount: r.scenario_count,
  }));
}

export async function findPublishedModule(slug: string): Promise<ModuleRow> {
  const { rows } = await db.query<ModuleRow>("SELECT * FROM training_modules WHERE slug = $1 AND status = 'published'", [slug]);
  if (!rows[0]) throw notFound('That training module does not exist.');
  return rows[0];
}

/** Full module content with per-section "viewed" flags for the caller. */
export async function getModule(slug: string, userId: number) {
  const mod = await findPublishedModule(slug);
  const [sections, progress, quiz, badge, scenarios] = await Promise.all([
    db.query<{
      section_id: number;
      heading: string;
      body: string;
      media_type: 'image' | 'video' | 'audio' | null;
      media_url: string | null;
      viewed: boolean;
    }>(
      `SELECT s.*, (v.user_id IS NOT NULL) AS viewed
       FROM module_sections s
       LEFT JOIN section_views v ON v.section_id = s.section_id AND v.user_id = $2
       WHERE s.module_id = $1 ORDER BY s.order_index, s.section_id`,
      [mod.module_id, userId],
    ),
    db.query<{ status: ModuleStatus; completed_at: Date | null }>(
      'SELECT status, completed_at FROM module_progress WHERE user_id = $1 AND module_id = $2',
      [userId, mod.module_id],
    ),
    db.query<{ passing_score: number; question_count: number }>(
      `SELECT passing_score, LEAST(questions_per_attempt, jsonb_array_length(questions)) AS question_count
       FROM quizzes WHERE module_id = $1 AND jsonb_array_length(questions) > 0`,
      [mod.module_id],
    ),
    db.query<{ title: string; earned_at: Date }>('SELECT title, earned_at FROM badges WHERE user_id = $1 AND module_id = $2', [
      userId,
      mod.module_id,
    ]),
    db.query<{ slug: string; title: string; completed: boolean }>(
      `SELECT sc.slug, sc.title,
              EXISTS (SELECT 1 FROM scenario_completions c WHERE c.scenario_id = sc.scenario_id AND c.user_id = $2) AS completed
       FROM scenarios sc WHERE sc.module_id = $1 AND sc.status = 'published' ORDER BY sc.order_index`,
      [mod.module_id, userId],
    ),
  ]);

  await startReadingClock(userId, mod.module_id);
  const quizRow = quiz.rows[0];
  const badgeRow = badge.rows[0];
  return {
    id: mod.module_id,
    slug: mod.slug,
    title: mod.title,
    topic: mod.topic,
    summary: mod.summary,
    estimatedMinutes: mod.estimated_minutes,
    contentVerified: mod.content_verified,
    sourceNote: mod.source_note,
    status: progress.rows[0]?.status ?? 'not_started',
    completedAt: progress.rows[0]?.completed_at ?? null,
    sections: sections.rows.map((s) => ({
      id: s.section_id,
      heading: s.heading,
      body: s.body,
      mediaType: s.media_type,
      mediaUrl: s.media_url,
      viewed: s.viewed,
    })),
    quiz: quizRow ? { passingScore: quizRow.passing_score, questionCount: quizRow.question_count } : null,
    badge: badgeRow ? { title: badgeRow.title, earnedAt: badgeRow.earned_at } : null,
    scenarios: scenarios.rows,
  };
}

/**
 * Note when the learner opened the module, so the time spent on the first
 * section can be measured. Re-opening within 30 minutes (a page refresh, say)
 * keeps the original time, so refreshing never makes careful reading look rushed.
 */
async function startReadingClock(userId: number, moduleId: number) {
  await db.query(
    `INSERT INTO module_activity (user_id, module_id) VALUES ($1, $2)
     ON CONFLICT (user_id, module_id) DO UPDATE SET last_seen_at = now()
     WHERE module_activity.last_seen_at < now() - interval '30 minutes'`,
    [userId, moduleId],
  );
}

/**
 * Record that a section was viewed. When every section of the module has been
 * viewed the module is marked complete (FR3).
 *
 * The time since the learner opened the module or finished the previous
 * section is measured on the server and compared with the section's length.
 * A section read far too fast still counts towards completion (nothing is
 * ever blocked) but is marked as rushed, earns no points, and the response
 * says so, so the page can nudge the learner kindly.
 */
export async function markSectionViewed(slug: string, sectionId: number, userId: number) {
  const mod = await findPublishedModule(slug);
  return db.withTransaction(async (client) => {
    const section = await client.query<{ body: string }>('SELECT body FROM module_sections WHERE section_id = $1 AND module_id = $2', [
      sectionId,
      mod.module_id,
    ]);
    if (!section.rowCount) throw notFound('That section is not part of this module.');

    // Seconds since the clock started; capped so a tab left open overnight stays a sensible number.
    const clock = await client.query<{ seconds: number }>(
      `SELECT LEAST(EXTRACT(EPOCH FROM now() - last_seen_at), 3600)::int AS seconds
       FROM module_activity WHERE user_id = $1 AND module_id = $2`,
      [userId, mod.module_id],
    );
    const seconds = clock.rows[0]?.seconds ?? 0;
    const pace = readingPace.evaluate({ body: section.rows[0]!.body }, seconds);

    const inserted = await client.query(
      'INSERT INTO section_views (user_id, section_id, dwell_seconds, rushed) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [userId, sectionId, seconds, pace.rushed],
    );
    await client.query(
      `INSERT INTO module_activity (user_id, module_id) VALUES ($1, $2)
       ON CONFLICT (user_id, module_id) DO UPDATE SET last_seen_at = now()`,
      [userId, mod.module_id],
    );
    await client.query('INSERT INTO module_progress (user_id, module_id) VALUES ($1, $2) ON CONFLICT (user_id, module_id) DO NOTHING', [
      userId,
      mod.module_id,
    ]);

    const { rows } = await client.query<{ total: number; viewed: number }>(
      `SELECT COUNT(*)::int AS total, COUNT(v.section_id)::int AS viewed
       FROM module_sections s
       LEFT JOIN section_views v ON v.section_id = s.section_id AND v.user_id = $2
       WHERE s.module_id = $1`,
      [mod.module_id, userId],
    );
    const { total, viewed } = rows[0]!;
    let status: ModuleStatus = 'in_progress';
    if (total > 0 && viewed >= total) {
      await client.query(
        `UPDATE module_progress SET status = 'completed', completed_at = COALESCE(completed_at, now())
         WHERE user_id = $1 AND module_id = $2`,
        [userId, mod.module_id],
      );
      status = 'completed';
    }
    // Only a first read is judged; re-marking a section changes nothing.
    const rushed = Boolean(inserted.rowCount) && pace.rushed;
    return { sectionsViewed: viewed, sectionCount: total, status, rushed };
  });
}
