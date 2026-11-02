// Idempotent seed: safe to run repeatedly, including on a live database.
// - Creates the starter accounts.
// - Adds the Solid Minds-based modules and scenarios that are missing, and
//   refreshes module text and quizzes when the version in content/modules.ts
//   goes up (never overwrites a module an admin has edited).
// - Archives the old prototype modules.
// - Keeps the directory in line with content/providers.ts: renames older
//   entries in place, retires services no longer offered, and never
//   overwrites an entry an admin has edited.
// - Adds the daily stories.
import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import config from '../config';
import { pool, withTransaction } from './pool';
import { modules, SOURCE_NOTE } from '../content/modules';
import { scenarios } from '../content/scenarios';
import { providers, RENAMED_PROVIDERS, RETIRED_PROVIDERS, type ProviderContent } from '../content/providers';
import { stories } from '../content/stories';
import { validateScript } from '../utils/scenario';
import { validateMarkup } from '../content/markup-check';
import type { ModuleContent } from '../content/types';

type Log = (message: string) => void;

/** How many questions each quiz attempt draws from the module's bank. */
export const QUESTIONS_PER_ATTEMPT = 5;

// Development defaults. In production each password MUST come from the environment.
const ACCOUNTS = [
  { username: 'admin', role: 'admin', env: 'SEED_ADMIN_PASSWORD', devPassword: 'BeaconAdmin#2026' },
  { username: 'coordinator', role: 'coordinator', env: 'SEED_COORDINATOR_PASSWORD', devPassword: 'BeaconCoord#2026' },
  { username: 'demo_peer', role: 'peer', env: 'SEED_DEMO_PASSWORD', devPassword: 'BeaconPeer#2026' },
] as const;

// Modules from the first prototype, replaced by Solid Minds content.
const LEGACY_MODULE_SLUGS = ['peer-supporter-role', 'active-listening', 'boundaries', 'safe-self-disclosure', 'referral-literacy', 'self-care'];

async function seedAccounts(client: PoolClient, log: Log) {
  for (const account of ACCOUNTS) {
    const password = process.env[account.env] || (config.isProduction ? null : account.devPassword);
    if (!password) {
      log(`Skipping ${account.username}: set ${account.env} to create it.`);
      continue;
    }
    const hash = await bcrypt.hash(password, 12);
    const { rowCount } = await client.query(
      `INSERT INTO users (username, password_hash, role, consent_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (username) DO NOTHING`,
      [account.username, hash, account.role],
    );
    if (rowCount) log(`Created ${account.role} account "${account.username}".`);
  }
}

/** Fail the deploy loudly if any authored content is malformed. */
function checkModule(m: ModuleContent) {
  const problems = m.sections.flatMap((s) => validateMarkup(s.body).map((p) => `"${s.heading}": ${p}`));
  if (m.quiz.length < QUESTIONS_PER_ATTEMPT) problems.push(`the quiz bank needs at least ${QUESTIONS_PER_ATTEMPT} questions`);
  if (problems.length) throw new Error(`Module "${m.slug}" has problems:\n- ${problems.join('\n- ')}`);
}

async function seedModules(client: PoolClient, log: Log) {
  const archived = await client.query(
    `UPDATE training_modules SET status = 'archived', updated_at = now()
     WHERE slug = ANY($1::text[]) AND status <> 'archived'`,
    [LEGACY_MODULE_SLUGS],
  );
  if (archived.rowCount) log(`Archived ${archived.rowCount} prototype module(s).`);

  for (const [i, m] of modules.entries()) {
    checkModule(m);
    const { rows } = await client.query<{ module_id: number }>(
      `INSERT INTO training_modules (slug, title, topic, summary, order_index, estimated_minutes, status, content_verified, source_note, content_version)
       VALUES ($1, $2, $3, $4, $5, $6, 'published', true, $7, $8)
       ON CONFLICT (slug) DO NOTHING RETURNING module_id`,
      [m.slug, m.title, m.topic, m.summary, i + 1, m.estimatedMinutes, SOURCE_NOTE, m.version],
    );
    const row = rows[0];
    if (!row) {
      await refreshModule(client, m, log);
      continue;
    }
    for (const [j, s] of m.sections.entries()) {
      await client.query('INSERT INTO module_sections (module_id, order_index, heading, body) VALUES ($1, $2, $3, $4)', [
        row.module_id,
        j,
        s.heading,
        s.body,
      ]);
    }
    await client.query(
      'INSERT INTO quizzes (module_id, passing_score, questions, questions_per_attempt, skill_questions) VALUES ($1, 70, $2, $3, $4)',
      [row.module_id, JSON.stringify(m.quiz), QUESTIONS_PER_ATTEMPT, JSON.stringify(m.skillCheck)],
    );
    log(`Seeded module "${m.title}".`);
  }
}

/**
 * Copy newer authored content into a module that is already in the database.
 * Skipped when an admin has edited the module, so reviewed wording is never
 * replaced. Sections are updated in place, keeping their ids, so the record of
 * which sections each learner has read is kept. The quiz bank and skill-check
 * questions are replaced; past attempts keep their own scores.
 */
async function refreshModule(client: PoolClient, m: ModuleContent, log: Log) {
  const { rows } = await client.query<{ module_id: number; content_version: number; admin_edited: boolean }>(
    'SELECT module_id, content_version, admin_edited FROM training_modules WHERE slug = $1',
    [m.slug],
  );
  const existing = rows[0];
  if (!existing || existing.admin_edited || existing.content_version >= m.version) return;

  await client.query(
    `UPDATE training_modules SET title = $1, topic = $2, summary = $3, estimated_minutes = $4, source_note = $5,
       content_version = $6, content_verified = true, updated_at = now()
     WHERE module_id = $7`,
    [m.title, m.topic, m.summary, m.estimatedMinutes, SOURCE_NOTE, m.version, existing.module_id],
  );
  const { rows: current } = await client.query<{ section_id: number }>(
    'SELECT section_id FROM module_sections WHERE module_id = $1 ORDER BY order_index, section_id',
    [existing.module_id],
  );
  for (const [j, s] of m.sections.entries()) {
    const id = current[j]?.section_id;
    if (id) {
      await client.query('UPDATE module_sections SET order_index = $1, heading = $2, body = $3 WHERE section_id = $4', [j, s.heading, s.body, id]);
    } else {
      await client.query('INSERT INTO module_sections (module_id, order_index, heading, body) VALUES ($1, $2, $3, $4)', [
        existing.module_id,
        j,
        s.heading,
        s.body,
      ]);
    }
  }
  const surplus = current.slice(m.sections.length).map((r) => r.section_id);
  if (surplus.length) await client.query('DELETE FROM module_sections WHERE section_id = ANY($1::int[])', [surplus]);
  await client.query(
    `INSERT INTO quizzes (module_id, passing_score, questions, questions_per_attempt, skill_questions) VALUES ($1, 70, $2, $3, $4)
     ON CONFLICT (module_id) DO UPDATE SET questions = EXCLUDED.questions,
       questions_per_attempt = EXCLUDED.questions_per_attempt, skill_questions = EXCLUDED.skill_questions`,
    [existing.module_id, JSON.stringify(m.quiz), QUESTIONS_PER_ATTEMPT, JSON.stringify(m.skillCheck)],
  );
  log(`Updated module "${m.title}" to content version ${m.version}.`);
}

async function seedScenarios(client: PoolClient, log: Log) {
  for (const [i, s] of scenarios.entries()) {
    const problems = validateScript(s.script);
    if (problems.length) throw new Error(`Scenario "${s.slug}" is invalid:\n- ${problems.join('\n- ')}`);
    const { rowCount } = await client.query(
      `INSERT INTO scenarios (slug, module_id, order_index, title, summary, persona, script, sensitive, content_verified)
       VALUES ($1, (SELECT module_id FROM training_modules WHERE slug = $2), $3, $4, $5, $6, $7, $8, true)
       ON CONFLICT (slug) DO NOTHING`,
      [s.slug, s.moduleSlug, i + 1, s.title, s.summary, JSON.stringify(s.persona), JSON.stringify(s.script), Boolean(s.sensitive)],
    );
    if (rowCount) log(`Seeded scenario "${s.title}".`);
  }
  // The authored scenarios have been reviewed by Solid Minds.
  await client.query('UPDATE scenarios SET content_verified = true WHERE slug = ANY($1::text[]) AND NOT content_verified', [
    scenarios.map((s) => s.slug),
  ]);
}

const providerValues = (p: ProviderContent) => [p.name, p.serviceType, p.description, p.onCampus, p.district, p.location, p.contact, p.email, p.website, p.hours];

async function seedProviders(client: PoolClient, log: Log) {
  // Rename older entries in place, so referrals already logged keep pointing at them.
  for (const [oldName, newName] of Object.entries(RENAMED_PROVIDERS)) {
    await client.query(
      `UPDATE providers SET name = $2, updated_at = now()
       WHERE name = $1 AND NOT admin_edited AND NOT EXISTS (SELECT 1 FROM providers WHERE name = $2)`,
      [oldName, newName],
    );
  }
  const retired = await client.query('UPDATE providers SET archived = true, updated_at = now() WHERE name = ANY($1::text[]) AND NOT archived', [
    RETIRED_PROVIDERS,
  ]);
  if (retired.rowCount) log(`Retired ${retired.rowCount} directory entr${retired.rowCount === 1 ? 'y' : 'ies'}.`);

  let added = 0;
  let updated = 0;
  for (const p of providers) {
    const result = await client.query<{ inserted: boolean }>(
      `INSERT INTO providers (name, service_type, description, on_campus, district, location, contact, email, website, hours, verified)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true
       WHERE NOT EXISTS (SELECT 1 FROM providers WHERE name = $1)
       RETURNING true AS inserted`,
      providerValues(p),
    );
    if (result.rowCount) {
      added += 1;
      continue;
    }
    // Bring seeded entries up to date with the verified details (admin edits win).
    const changed = await client.query(
      `UPDATE providers SET service_type = $2, description = $3, on_campus = $4, district = $5, location = $6,
         contact = $7, email = $8, website = $9, hours = $10, verified = true, archived = false, updated_at = now()
       WHERE name = $1 AND NOT admin_edited
         AND (service_type, description, on_campus, district, location, contact, email, website, hours, verified, archived)
             IS DISTINCT FROM ($2, $3, $4, $5, $6, $7, $8, $9, $10, true, false)`,
      providerValues(p),
    );
    updated += changed.rowCount ?? 0;
  }
  if (added) log(`Added ${added} directory entr${added === 1 ? 'y' : 'ies'}.`);
  if (updated) log(`Updated ${updated} directory entr${updated === 1 ? 'y' : 'ies'}.`);
}

async function seedStories(client: PoolClient, log: Log) {
  let added = 0;
  for (const [i, s] of stories.entries()) {
    const problems = validateMarkup(s.body);
    if (problems.length) throw new Error(`Story "${s.slug}" has formatting problems:\n- ${problems.join('\n- ')}`);
    // Stories are authored in code only, so the code version always wins.
    const { rows } = await client.query<{ inserted: boolean }>(
      `INSERT INTO stories (slug, title, body, reflection, module_slug, order_index) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, reflection = EXCLUDED.reflection,
         module_slug = EXCLUDED.module_slug, order_index = EXCLUDED.order_index
       RETURNING (xmax = 0) AS inserted`,
      [s.slug, s.title, s.body, s.reflection, s.moduleSlug, i],
    );
    if (rows[0]?.inserted) added += 1;
  }
  if (added) log(`Added ${added} daily stor${added === 1 ? 'y' : 'ies'}.`);
}

export async function seed({ log = console.log as Log } = {}) {
  await withTransaction(async (client) => {
    await seedAccounts(client, log);
    await seedModules(client, log);
    await seedScenarios(client, log);
    await seedProviders(client, log);
    await seedStories(client, log);
  });
  log('Seeding complete.');
}

if (require.main === module) {
  seed()
    .then(() => pool.end())
    .catch((err: unknown) => {
      console.error(err);
      process.exit(1);
    });
}
