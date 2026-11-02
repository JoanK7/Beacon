// Programme Coordinator dashboard (FR10). Returns cohort-level aggregates only:
// no usernames, notes or reflection text ever leave this service.
import * as db from '../db/pool';
import { normalisedGain } from '../domain/learning-integrity';

// Averages over fewer than this many responses are withheld, so a coordinator
// cannot infer an individual's mood or rating in a small cohort.
export const MIN_GROUP_SIZE = 3;

const suppress = (count: number, value: number | null) => (count >= MIN_GROUP_SIZE ? value : null);

type LabelCount = { label: string; count: number };

/**
 * Is learning real? Cohort-level signals of careful reading, honest first
 * attempts and knowledge gained, each hidden when too few people contribute.
 */
async function getLearningQuality() {
  const [reading, firstTries, modes, gains] = await Promise.all([
    db.query<{ people: number; reads: number; rushed: number }>(
      `SELECT COUNT(DISTINCT user_id)::int AS people, COUNT(*)::int AS reads, COUNT(*) FILTER (WHERE rushed)::int AS rushed
       FROM section_views v JOIN users u USING (user_id) WHERE u.role = 'peer'`,
    ),
    db.query<{ people: number; average: number | null; passes: number; attempts: number }>(
      `SELECT COUNT(DISTINCT a.user_id)::int AS people, ROUND(AVG(a.score), 1)::float AS average,
              COUNT(*) FILTER (WHERE a.passed)::int AS passes, COUNT(*)::int AS attempts
       FROM quiz_attempts a JOIN users u USING (user_id)
       WHERE u.role = 'peer' AND a.mode = 'first' AND a.submitted_at IS NOT NULL`,
    ),
    db.query<{ mode: 'first' | 'new' | 'repeat'; attempts: number; rushed: number }>(
      `SELECT a.mode, COUNT(*)::int AS attempts, COUNT(*) FILTER (WHERE a.rushed)::int AS rushed
       FROM quiz_attempts a JOIN users u USING (user_id)
       WHERE u.role = 'peer' AND a.submitted_at IS NOT NULL GROUP BY a.mode`,
    ),
    // Each person's latest pre and post skill-check scores, side by side.
    db.query<{ pre: number; post: number }>(
      `SELECT pre.score AS pre, post.score AS post
       FROM (SELECT DISTINCT ON (user_id) user_id, score FROM skill_check_attempts WHERE kind = 'pre' ORDER BY user_id, created_at DESC) pre
       JOIN (SELECT DISTINCT ON (user_id) user_id, score FROM skill_check_attempts WHERE kind = 'post' ORDER BY user_id, created_at DESC) post
         USING (user_id)`,
    ),
  ]);
  const r = reading.rows[0]!;
  const f = firstTries.rows[0]!;
  const quizAttempts = modes.rows.reduce((n, m) => n + m.attempts, 0);
  const rushedQuizzes = modes.rows.reduce((n, m) => n + m.rushed, 0);
  const individualGains = gains.rows.map((g) => normalisedGain(g.pre, g.post)).filter((g): g is number => g !== null);
  const averageGain = individualGains.length ? Math.round((individualGains.reduce((a, b) => a + b, 0) / individualGains.length) * 100) / 100 : null;
  return {
    readingPeople: r.people,
    rushedReadRate: suppress(r.people, r.reads ? Math.round((r.rushed / r.reads) * 100) : null),
    firstTryPeople: f.people,
    firstTryAverage: suppress(f.people, f.average),
    firstTryPassRate: suppress(f.people, f.attempts ? Math.round((f.passes / f.attempts) * 100) : null),
    attemptsByMode: Object.fromEntries(['first', 'new', 'repeat'].map((m) => [m, modes.rows.find((row) => row.mode === m)?.attempts ?? 0])) as Record<
      'first' | 'new' | 'repeat',
      number
    >,
    rushedQuizRate: quizAttempts >= MIN_GROUP_SIZE ? Math.round((rushedQuizzes / quizAttempts) * 100) : null,
    gainPeople: individualGains.length,
    averageGain: suppress(individualGains.length, averageGain),
  };
}

export async function getCohortDashboard() {
  const [overview, modules, sessionsByCategory, outcomes, referralsByType, mood, sus, weekly, skill, scenarios] = await Promise.all([
    db.query<{
      peers: number;
      active_last_14_days: number;
      module_completions: number;
      quiz_attempts: number;
      quiz_passes: number;
      badges_awarded: number;
      sessions_logged: number;
      referrals_made: number;
      scenario_completions: number;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE role = 'peer')::int AS peers,
         (SELECT COUNT(DISTINCT user_id) FROM (
            SELECT v.user_id FROM section_views v WHERE v.viewed_at > now() - interval '14 days'
            UNION SELECT c.user_id FROM scenario_completions c WHERE c.completed_at > now() - interval '14 days'
            UNION SELECT s.user_id FROM support_sessions s WHERE s.created_at > now() - interval '14 days'
          ) a)::int AS active_last_14_days,
         (SELECT COUNT(*) FROM module_progress WHERE status = 'completed')::int AS module_completions,
         (SELECT COUNT(*) FROM quiz_attempts WHERE submitted_at IS NOT NULL)::int AS quiz_attempts,
         (SELECT COUNT(*) FROM quiz_attempts WHERE passed)::int AS quiz_passes,
         (SELECT COUNT(*) FROM badges)::int AS badges_awarded,
         (SELECT COUNT(*) FROM support_sessions)::int AS sessions_logged,
         (SELECT COUNT(*) FROM referrals)::int AS referrals_made,
         (SELECT COUNT(*) FROM scenario_completions)::int AS scenario_completions`,
    ),
    db.query<{ title: string; slug: string; started: number; completed: number; badges: number }>(
      `SELECT m.title, m.slug, m.order_index,
              COUNT(DISTINCT p.user_id) FILTER (WHERE p.status IS NOT NULL)::int AS started,
              COUNT(DISTINCT p.user_id) FILTER (WHERE p.status = 'completed')::int AS completed,
              COUNT(DISTINCT b.user_id)::int AS badges
       FROM training_modules m
       LEFT JOIN module_progress p ON p.module_id = m.module_id
       LEFT JOIN badges b ON b.module_id = m.module_id
       WHERE m.status = 'published'
       GROUP BY m.module_id ORDER BY m.order_index`,
    ),
    db.query<LabelCount>('SELECT category AS label, COUNT(*)::int AS count FROM support_sessions GROUP BY category ORDER BY count DESC'),
    db.query<LabelCount>('SELECT outcome AS label, COUNT(*)::int AS count FROM support_sessions GROUP BY outcome ORDER BY count DESC'),
    db.query<LabelCount>(
      `SELECT p.service_type AS label, COUNT(*)::int AS count
       FROM referrals r JOIN providers p ON p.provider_id = r.provider_id
       GROUP BY p.service_type ORDER BY count DESC`,
    ),
    db.query<{ count: number; average: number | null }>(
      `SELECT COUNT(*)::int AS count, ROUND(AVG(mood_rating), 2)::float AS average
       FROM reflections WHERE created_at > now() - interval '30 days'`,
    ),
    db.query<{ count: number; average: number | null }>('SELECT COUNT(*)::int AS count, ROUND(AVG(sus_score), 1)::float AS average FROM feedback'),
    db.query<{ week: string; count: number }>(
      `SELECT to_char(date_trunc('week', created_at), 'YYYY-MM-DD') AS week, COUNT(*)::int AS count
       FROM support_sessions WHERE created_at > now() - interval '8 weeks'
       GROUP BY 1 ORDER BY 1`,
    ),
    // Skill check (RQ3): each person's latest pre and latest post result, averaged per kind.
    db.query<{ kind: 'pre' | 'post'; people: number; average: number | null }>(
      `SELECT kind, COUNT(*)::int AS people, ROUND(AVG(score), 1)::float AS average
       FROM (SELECT DISTINCT ON (user_id, kind) user_id, kind, score
             FROM skill_check_attempts ORDER BY user_id, kind, created_at DESC) latest
       GROUP BY kind`,
    ),
    db.query<{ title: string; completions: number }>(
      `SELECT sc.title, COUNT(DISTINCT c.user_id)::int AS completions
       FROM scenarios sc LEFT JOIN scenario_completions c ON c.scenario_id = sc.scenario_id
       WHERE sc.status = 'published' GROUP BY sc.scenario_id ORDER BY sc.order_index`,
    ),
  ]);

  const learningQuality = await getLearningQuality();
  const o = overview.rows[0]!;
  const moodRow = mood.rows[0]!;
  const susRow = sus.rows[0]!;
  const pre = skill.rows.find((r) => r.kind === 'pre');
  const post = skill.rows.find((r) => r.kind === 'post');
  return {
    generatedAt: new Date().toISOString(),
    minGroupSize: MIN_GROUP_SIZE,
    overview: {
      peers: o.peers,
      activeLast14Days: o.active_last_14_days,
      moduleCompletions: o.module_completions,
      quizAttempts: o.quiz_attempts,
      quizPassRate: o.quiz_attempts ? Math.round((o.quiz_passes / o.quiz_attempts) * 100) : null,
      badgesAwarded: o.badges_awarded,
      sessionsLogged: o.sessions_logged,
      referralsMade: o.referrals_made,
      scenarioCompletions: o.scenario_completions,
    },
    modules: modules.rows.map((m) => ({
      title: m.title,
      slug: m.slug,
      started: m.started,
      completed: m.completed,
      badges: m.badges,
      completionRate: o.peers ? Math.round((m.completed / o.peers) * 100) : 0,
    })),
    sessionsByCategory: sessionsByCategory.rows,
    sessionOutcomes: outcomes.rows,
    referralsByServiceType: referralsByType.rows,
    wellbeing: { reflections30Days: moodRow.count, averageMood: suppress(moodRow.count, moodRow.average) },
    usability: { responses: susRow.count, averageSus: suppress(susRow.count, susRow.average) },
    skillCheck: {
      prePeople: pre?.people ?? 0,
      preAverage: pre ? suppress(pre.people, pre.average) : null,
      postPeople: post?.people ?? 0,
      postAverage: post ? suppress(post.people, post.average) : null,
    },
    learningQuality,
    scenarios: scenarios.rows,
    sessionsPerWeek: weekly.rows,
  };
}
