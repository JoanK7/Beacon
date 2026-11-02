// Progress Tracking Service: points, levels, badges, streak, activity counts
// and the learner's own learning measures.
import * as db from '../db/pool';
import { calculatePoints, levelForPoints } from '../utils/scoring';
import { StreakCalculator } from '../domain/streak';
import { LOCAL_TODAY_SQL, localDateSql } from '../utils/local-time';

const streaks = new StreakCalculator();

/** Dates (Kigali time) on which the learner did any learning activity, plus today's date. */
async function activityDates(userId: number) {
  const { rows } = await db.query<{ day: string }>(
    `SELECT DISTINCT day FROM (
       SELECT ${localDateSql('viewed_at')} AS day FROM section_views WHERE user_id = $1
       UNION SELECT ${localDateSql('submitted_at')} FROM quiz_attempts WHERE user_id = $1 AND submitted_at IS NOT NULL
       UNION SELECT ${localDateSql('completed_at')} FROM scenario_completions WHERE user_id = $1
       UNION SELECT ${localDateSql('read_at')} FROM story_reads WHERE user_id = $1
       UNION SELECT ${localDateSql('created_at')} FROM reflections WHERE user_id = $1
       UNION SELECT ${localDateSql('created_at')} FROM skill_check_attempts WHERE user_id = $1
     ) d`,
    [userId],
  );
  const today = await db.query<{ today: string }>(`SELECT ${LOCAL_TODAY_SQL} AS today`);
  return { days: rows.map((r) => r.day), today: today.rows[0]!.today };
}

export async function getStreak(userId: number) {
  const { days, today } = await activityDates(userId);
  return streaks.summarise(days, today);
}

export async function getSummary(userId: number) {
  const { rows } = await db.query<{
    sections_viewed: number;
    careful_reads: number;
    modules_completed: number;
    modules_total: number;
    sessions_logged: number;
    referrals_made: number;
    reflections_written: number;
    scenarios_completed: number;
    scenarios_total: number;
    stories_read: number;
    first_try_average: number | null;
    first_tries: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM section_views WHERE user_id = $1)::int AS sections_viewed,
       (SELECT COUNT(*) FROM section_views WHERE user_id = $1 AND NOT rushed)::int AS careful_reads,
       (SELECT COUNT(*) FROM module_progress WHERE user_id = $1 AND status = 'completed')::int AS modules_completed,
       (SELECT COUNT(*) FROM training_modules WHERE status = 'published')::int AS modules_total,
       (SELECT COUNT(*) FROM support_sessions WHERE user_id = $1)::int AS sessions_logged,
       (SELECT COUNT(*) FROM referrals r JOIN support_sessions s ON s.session_id = r.session_id
          WHERE s.user_id = $1)::int AS referrals_made,
       (SELECT COUNT(*) FROM reflections WHERE user_id = $1)::int AS reflections_written,
       (SELECT COUNT(DISTINCT scenario_id) FROM scenario_completions WHERE user_id = $1)::int AS scenarios_completed,
       (SELECT COUNT(*) FROM scenarios WHERE status = 'published')::int AS scenarios_total,
       (SELECT COUNT(*) FROM story_reads WHERE user_id = $1)::int AS stories_read,
       (SELECT ROUND(AVG(score))::int FROM quiz_attempts WHERE user_id = $1 AND mode = 'first' AND submitted_at IS NOT NULL) AS first_try_average,
       (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = $1 AND mode = 'first' AND submitted_at IS NOT NULL)::int AS first_tries`,
    [userId],
  );
  const stats = rows[0]!;

  const [badges, streak] = await Promise.all([
    db.query<{ badge_id: number; title: string; type: string; earned_at: Date; slug: string; topic: string }>(
      `SELECT b.badge_id, b.title, b.type, b.earned_at, m.slug, m.topic
       FROM badges b JOIN training_modules m ON m.module_id = b.module_id
       WHERE b.user_id = $1 ORDER BY b.earned_at`,
      [userId],
    ),
    getStreak(userId),
  ]);

  const points = calculatePoints({
    sectionsViewed: stats.careful_reads,
    modulesCompleted: stats.modules_completed,
    badgesEarned: badges.rowCount ?? 0,
    scenariosCompleted: stats.scenarios_completed,
    storiesRead: stats.stories_read,
  });

  return {
    points,
    ...levelForPoints(points),
    modulesCompleted: stats.modules_completed,
    modulesTotal: stats.modules_total,
    sectionsViewed: stats.sections_viewed,
    carefulReads: stats.careful_reads,
    sessionsLogged: stats.sessions_logged,
    referralsMade: stats.referrals_made,
    reflectionsWritten: stats.reflections_written,
    scenariosCompleted: stats.scenarios_completed,
    scenariosTotal: stats.scenarios_total,
    storiesRead: stats.stories_read,
    /** Average score on each module's very first quiz attempt: the most honest measure of what was learned. */
    firstTryAverage: stats.first_try_average,
    firstTries: stats.first_tries,
    streak,
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
