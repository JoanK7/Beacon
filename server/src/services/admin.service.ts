// Content administration (FR9): training modules, quizzes, scenarios and the provider directory.
import type { PoolClient } from 'pg';
import type { z } from 'zod';
import * as db from '../db/pool';
import { toProvider, type ProviderRow } from './referral.service';
import { notFound, conflict } from '../utils/http-error';
import type { moduleInput, providerInput } from '../schemas';
import type { QuizQuestion } from '../utils/scoring';

type ModuleInput = z.output<typeof moduleInput>;
type ProviderInput = z.output<typeof providerInput>;
type ContentStatus = 'draft' | 'published' | 'archived';

// Modules ------------------------------------------------------------------

export async function listAllModules() {
  const { rows } = await db.query<{
    module_id: number;
    slug: string;
    title: string;
    topic: string;
    status: ContentStatus;
    content_verified: boolean;
    order_index: number;
    section_count: number;
    question_count: number;
    updated_at: Date;
  }>(
    `SELECT m.*, COUNT(s.section_id)::int AS section_count,
            COALESCE(jsonb_array_length(q.questions), 0) AS question_count
     FROM training_modules m
     LEFT JOIN module_sections s ON s.module_id = m.module_id
     LEFT JOIN quizzes q ON q.module_id = m.module_id
     GROUP BY m.module_id, q.questions
     ORDER BY m.order_index, m.module_id`,
  );
  return rows.map((m) => ({
    id: m.module_id,
    slug: m.slug,
    title: m.title,
    topic: m.topic,
    status: m.status,
    contentVerified: m.content_verified,
    orderIndex: m.order_index,
    sectionCount: m.section_count,
    questionCount: m.question_count,
    updatedAt: m.updated_at,
  }));
}

export async function getModuleForEdit(moduleId: number) {
  const { rows } = await db.query<{
    module_id: number;
    slug: string;
    title: string;
    topic: string;
    summary: string;
    order_index: number;
    estimated_minutes: number;
    status: ContentStatus;
    content_verified: boolean;
  }>('SELECT * FROM training_modules WHERE module_id = $1', [moduleId]);
  const m = rows[0];
  if (!m) throw notFound('Module not found.');
  const [sections, quiz] = await Promise.all([
    db.query<{ section_id: number; heading: string; body: string; media_type: string | null; media_url: string | null }>(
      'SELECT * FROM module_sections WHERE module_id = $1 ORDER BY order_index, section_id',
      [moduleId],
    ),
    db.query<{ passing_score: number; questions: QuizQuestion[] }>('SELECT * FROM quizzes WHERE module_id = $1', [moduleId]),
  ]);
  return {
    id: m.module_id,
    slug: m.slug,
    title: m.title,
    topic: m.topic,
    summary: m.summary,
    orderIndex: m.order_index,
    estimatedMinutes: m.estimated_minutes,
    status: m.status,
    contentVerified: m.content_verified,
    sections: sections.rows.map((s) => ({
      id: s.section_id,
      heading: s.heading,
      body: s.body,
      mediaType: s.media_type,
      mediaUrl: s.media_url,
    })),
    quiz: {
      passingScore: quiz.rows[0]?.passing_score ?? 70,
      questions: quiz.rows[0]?.questions ?? [],
    },
  };
}

/**
 * Upsert sections: existing ids are updated (keeping learners' view history),
 * new ones inserted, and any not in the payload removed.
 */
async function saveSections(client: PoolClient, moduleId: number, sections: ModuleInput['sections']) {
  const keepIds = sections.filter((s) => s.id).map((s) => s.id);
  await client.query('DELETE FROM module_sections WHERE module_id = $1 AND NOT (section_id = ANY($2::int[]))', [moduleId, keepIds]);
  for (const [i, s] of sections.entries()) {
    const media = [s.mediaUrl ? s.mediaType || 'image' : null, s.mediaUrl || null];
    if (s.id) {
      await client.query(
        `UPDATE module_sections SET order_index = $1, heading = $2, body = $3, media_type = $4, media_url = $5
         WHERE section_id = $6 AND module_id = $7`,
        [i, s.heading, s.body, ...media, s.id, moduleId],
      );
    } else {
      await client.query(
        `INSERT INTO module_sections (module_id, order_index, heading, body, media_type, media_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [moduleId, i, s.heading, s.body, ...media],
      );
    }
  }
}

async function saveQuiz(client: PoolClient, moduleId: number, quiz: ModuleInput['quiz']) {
  await client.query(
    `INSERT INTO quizzes (module_id, passing_score, questions) VALUES ($1, $2, $3)
     ON CONFLICT (module_id) DO UPDATE SET passing_score = EXCLUDED.passing_score, questions = EXCLUDED.questions`,
    [moduleId, quiz.passingScore, JSON.stringify(quiz.questions)],
  );
}

async function assertSlugFree(slug: string, exceptId: number | null = null) {
  const { rowCount } = await db.query('SELECT 1 FROM training_modules WHERE slug = $1 AND module_id IS DISTINCT FROM $2', [slug, exceptId]);
  if (rowCount) throw conflict('Another module already uses that URL slug.');
}

export async function createModule(data: ModuleInput) {
  await assertSlugFree(data.slug);
  const id = await db.withTransaction(async (client) => {
    const { rows } = await client.query<{ module_id: number }>(
      `INSERT INTO training_modules (slug, title, topic, summary, order_index, estimated_minutes, status, content_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING module_id`,
      [data.slug, data.title, data.topic, data.summary, data.orderIndex, data.estimatedMinutes, data.status, data.contentVerified],
    );
    const moduleId = rows[0]!.module_id;
    await saveSections(client, moduleId, data.sections);
    await saveQuiz(client, moduleId, data.quiz);
    return moduleId;
  });
  return getModuleForEdit(id);
}

export async function updateModule(moduleId: number, data: ModuleInput) {
  await assertSlugFree(data.slug, moduleId);
  await db.withTransaction(async (client) => {
    const { rowCount } = await client.query(
      `UPDATE training_modules SET slug = $1, title = $2, topic = $3, summary = $4, order_index = $5,
         estimated_minutes = $6, status = $7, content_verified = $8, admin_edited = true, updated_at = now()
       WHERE module_id = $9`,
      [data.slug, data.title, data.topic, data.summary, data.orderIndex, data.estimatedMinutes, data.status, data.contentVerified, moduleId],
    );
    if (!rowCount) throw notFound('Module not found.');
    await saveSections(client, moduleId, data.sections);
    await saveQuiz(client, moduleId, data.quiz);
  });
  return getModuleForEdit(moduleId);
}

export async function setModuleStatus(moduleId: number, status: ContentStatus) {
  const { rowCount } = await db.query('UPDATE training_modules SET status = $1, updated_at = now() WHERE module_id = $2', [status, moduleId]);
  if (!rowCount) throw notFound('Module not found.');
}

// Scenarios ------------------------------------------------------------------
// Scenario scripts are authored in code (server/src/content) and reviewed by
// the clinical partner; admins control whether each one is visible.

export async function listAllScenarios() {
  const { rows } = await db.query<{
    scenario_id: number;
    slug: string;
    title: string;
    status: ContentStatus;
    sensitive: boolean;
    content_verified: boolean;
    module_title: string | null;
    completions: number;
  }>(
    `SELECT sc.scenario_id, sc.slug, sc.title, sc.status, sc.sensitive, sc.content_verified, m.title AS module_title,
            (SELECT COUNT(*) FROM scenario_completions c WHERE c.scenario_id = sc.scenario_id)::int AS completions
     FROM scenarios sc LEFT JOIN training_modules m ON m.module_id = sc.module_id
     ORDER BY sc.order_index, sc.scenario_id`,
  );
  return rows.map((s) => ({
    id: s.scenario_id,
    slug: s.slug,
    title: s.title,
    status: s.status,
    sensitive: s.sensitive,
    contentVerified: s.content_verified,
    moduleTitle: s.module_title,
    completions: s.completions,
  }));
}

export async function setScenarioStatus(scenarioId: number, status: ContentStatus) {
  const { rowCount } = await db.query('UPDATE scenarios SET status = $1, updated_at = now() WHERE scenario_id = $2', [status, scenarioId]);
  if (!rowCount) throw notFound('Scenario not found.');
}

// Providers ----------------------------------------------------------------

const PROVIDER_COLUMNS = ['name', 'service_type', 'description', 'on_campus', 'district', 'location', 'contact', 'hours', 'verified'];
const providerValues = (p: ProviderInput) => [p.name, p.serviceType, p.description, p.onCampus, p.district, p.location, p.contact, p.hours, p.verified];

export async function createProvider(data: ProviderInput) {
  const { rows } = await db.query<ProviderRow>(
    `INSERT INTO providers (${PROVIDER_COLUMNS.join(', ')})
     VALUES (${PROVIDER_COLUMNS.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
    providerValues(data),
  );
  return toProvider(rows[0]!);
}

export async function updateProvider(providerId: number, data: ProviderInput) {
  const sets = PROVIDER_COLUMNS.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const { rows } = await db.query<ProviderRow>(
    `UPDATE providers SET ${sets}, updated_at = now() WHERE provider_id = $${PROVIDER_COLUMNS.length + 1} RETURNING *`,
    [...providerValues(data), providerId],
  );
  if (!rows[0]) throw notFound('Provider not found.');
  return toProvider(rows[0]);
}

export async function setProviderArchived(providerId: number, archived: boolean) {
  const { rowCount } = await db.query('UPDATE providers SET archived = $1, updated_at = now() WHERE provider_id = $2', [archived, providerId]);
  if (!rowCount) throw notFound('Provider not found.');
}
