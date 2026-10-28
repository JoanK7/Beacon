// Scenario role-play service: list, play and complete branching conversations.
import * as db from '../db/pool';
import { notFound, badRequest } from '../utils/http-error';
import { InvalidPathError, replayScenario, type PathStep } from '../utils/scenario';
import type { ScenarioPersona, ScenarioScript } from '../content/types';

interface ScenarioRow {
  scenario_id: number;
  slug: string;
  title: string;
  summary: string;
  persona: ScenarioPersona;
  script: ScenarioScript;
  sensitive: boolean;
  content_verified: boolean;
  module_slug: string | null;
  module_title: string | null;
  module_topic: string | null;
}

const SELECT_SCENARIO = `
  SELECT sc.*, m.slug AS module_slug, m.title AS module_title, m.topic AS module_topic
  FROM scenarios sc LEFT JOIN training_modules m ON m.module_id = sc.module_id
  WHERE sc.status = 'published'`;

/** Published scenarios with the caller's completion status and best insight score. */
export async function listScenarios(userId: number) {
  const { rows } = await db.query<ScenarioRow & { best: number | null; plays: number }>(
    `SELECT s.*, best.best, COALESCE(best.plays, 0)::int AS plays FROM (${SELECT_SCENARIO}) s
     LEFT JOIN (
       SELECT scenario_id, MAX(insight_score)::int AS best, COUNT(*) AS plays
       FROM scenario_completions WHERE user_id = $1 GROUP BY scenario_id
     ) best ON best.scenario_id = s.scenario_id
     ORDER BY s.order_index, s.scenario_id`,
    [userId],
  );
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    persona: r.persona,
    sensitive: r.sensitive,
    contentVerified: r.content_verified,
    module: r.module_slug ? { slug: r.module_slug, title: r.module_title, topic: r.module_topic } : null,
    completed: r.plays > 0,
    bestInsight: r.best,
  }));
}

async function findScenario(slug: string): Promise<ScenarioRow> {
  const { rows } = await db.query<ScenarioRow>(`${SELECT_SCENARIO} AND sc.slug = $1`, [slug]);
  if (!rows[0]) throw notFound('That scenario does not exist.');
  return rows[0];
}

/**
 * Full scenario, including feedback for every choice. This is practice, not
 * assessment, so there is nothing to hide: the learner explores consequences.
 */
export async function getScenario(slug: string) {
  const s = await findScenario(slug);
  return {
    slug: s.slug,
    title: s.title,
    summary: s.summary,
    persona: s.persona,
    sensitive: s.sensitive,
    contentVerified: s.content_verified,
    module: s.module_slug ? { slug: s.module_slug, title: s.module_title, topic: s.module_topic } : null,
    script: s.script,
  };
}

/** Verify the learner's path server-side and record the completion. */
export async function completeScenario(slug: string, userId: number, path: PathStep[]) {
  const s = await findScenario(slug);
  let result;
  try {
    result = replayScenario(s.script, path);
  } catch (err) {
    if (err instanceof InvalidPathError) throw badRequest(`That play-through could not be checked: ${err.message}`);
    throw err;
  }
  const { rows } = await db.query<{ first: boolean }>(
    `WITH prior AS (SELECT COUNT(*) AS n FROM scenario_completions WHERE user_id = $1 AND scenario_id = $2)
     INSERT INTO scenario_completions (user_id, scenario_id, insight_score)
     VALUES ($1, $2, $3) RETURNING (SELECT n = 0 FROM prior) AS first`,
    [userId, s.scenario_id, result.insightScore],
  );
  return { insightScore: result.insightScore, retries: result.retries, firstCompletion: rows[0]!.first };
}
