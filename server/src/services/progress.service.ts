// Progress Tracking Service: points, levels, badges and activity counts.
import * as db from '../db/pool';
import { calculatePoints, levelForPoints } from '../utils/scoring';

export async function getSummary(userId: number) {
  const { rows } = await db.query<{
    sections_viewed: number;
    modules_completed: number;
    modules_total: number;
    sessions_logged: number;
    referrals_made: number;
    reflections_written: number;
    scenarios_completed: number;
    scenarios_total: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM section_views WHERE user_id = $1)::int AS sections_viewed,
       (SELECT COUNT(*) FROM module_progress WHERE user_id = $1 AND status = 'completed')::int AS modules_completed,
       (SELECT COUNT(*) FROM training_modules WHERE status = 'published')::int AS modules_total,
       (SELECT COUNT(*) FROM support_sessions WHERE user_id = $1)::int AS sessions_logged,
       (SELECT COUNT(*) FROM referrals r JOIN support_sessions s ON s.session_id = r.session_id
          WHERE s.user_id = $1)::int AS referrals_made,
       (SELECT COUNT(*) FROM reflections WHERE user_id = $1)::int AS reflections_written,
       (SELECT COUNT(DISTINCT scenario_id) FROM scenario_completions WHERE user_id = $1)::int AS scenarios_completed,
       (SELECT COUNT(*) FROM scenarios WHERE status = 'published')::int AS scenarios_total`,
    [userId],
  );
  const stats = rows[0]!;

  const badges = await db.query<{ badge_id: number; title: string; type: string; earned_at: Date; slug: string; topic: string }>(
    `SELECT b.badge_id, b.title, b.type, b.earned_at, m.slug, m.topic
     FROM badges b JOIN training_modules m ON m.module_id = b.module_id
     WHERE b.user_id = $1 ORDER BY b.earned_at`,
    [userId],
  );

  const points = calculatePoints({
    sectionsViewed: stats.sections_viewed,
    modulesCompleted: stats.modules_completed,
    badgesEarned: badges.rowCount ?? 0,
    scenariosCompleted: stats.scenarios_completed,
  });

  return {
    points,
    ...levelForPoints(points),
    modulesCompleted: stats.modules_completed,
    modulesTotal: stats.modules_total,
    sectionsViewed: stats.sections_viewed,
    sessionsLogged: stats.sessions_logged,
    referralsMade: stats.referrals_made,
    reflectionsWritten: stats.reflections_written,
    scenariosCompleted: stats.scenarios_completed,
    scenariosTotal: stats.scenarios_total,
    badges: badges.rows.map((b) => ({
      id: b.badge_id,
      title: b.title,
      type: b.type,
      earnedAt: b.earned_at,
      moduleSlug: b.slug,
      topic: b.topic,
    })),
  };
}
