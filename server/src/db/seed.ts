// Idempotent seed: safe to run repeatedly, including on a live database.
// - Creates the starter accounts.
// - Adds the Solid Minds-based modules and scenarios that are missing, and
//   refreshes module text when its version in content/modules.ts goes up
//   (never overwrites a module an admin has edited).
// - Archives the old placeholder modules from the first prototype.
// - Adds missing directory entries.
import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import config from '../config';
import { pool, withTransaction } from './pool';
import { modules, SOURCE_NOTE } from '../content/modules';
import { scenarios } from '../content/scenarios';
import { providers, LEGACY_COUNSELLING_PLACEHOLDER } from '../content/providers';
import { validateScript } from '../utils/scenario';
import { validateMarkup } from '../content/markup-check';
import type { ModuleContent } from '../content/types';

type Log = (message: string) => void;

// Development defaults. In production each password MUST come from the environment.
const ACCOUNTS = [
  { username: 'admin', role: 'admin', env: 'SEED_ADMIN_PASSWORD', devPassword: 'BeaconAdmin#2026' },
  { username: 'coordinator', role: 'coordinator', env: 'SEED_COORDINATOR_PASSWORD', devPassword: 'BeaconCoord#2026' },
  { username: 'demo_peer', role: 'peer', env: 'SEED_DEMO_PASSWORD', devPassword: 'BeaconPeer#2026' },
] as const;

// Placeholder modules from the first prototype, replaced by Solid Minds content.
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

async function seedModules(client: PoolClient, log: Log) {
  const archived = await client.query(
    `UPDATE training_modules SET status = 'archived', updated_at = now()
     WHERE slug = ANY($1::text[]) AND status <> 'archived'`,
    [LEGACY_MODULE_SLUGS],
  );
  if (archived.rowCount) log(`Archived ${archived.rowCount} placeholder module(s) from the prototype.`);

  for (const [i, m] of modules.entries()) {
    const problems = m.sections.flatMap((s) => validateMarkup(s.body).map((p) => `"${s.heading}": ${p}`));
    if (problems.length) throw new Error(`Module "${m.slug}" has formatting problems:\n- ${problems.join('\n- ')}`);

    const { rows } = await client.query<{ module_id: number }>(
      `INSERT INTO training_modules (slug, title, topic, summary, order_index, estimated_minutes, status, content_verified, source_note, content_version)
       VALUES ($1, $2, $3, $4, $5, $6, 'published', false, $7, $8)
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
    await client.query('INSERT INTO quizzes (module_id, passing_score, questions) VALUES ($1, 70, $2)', [
      row.module_id,
      JSON.stringify(m.quiz),
    ]);
    log(`Seeded module "${m.title}".`);
  }
}

/**
 * Copy newer authored text into a module that is already in the database.
 * Skipped when an admin has edited the module, so reviewed wording is never
 * replaced. Sections are updated in place, keeping their ids, so the record of
 * which sections each learner has read is kept. Quizzes are left unchanged.
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
       content_version = $6, updated_at = now()
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
  log(`Updated module "${m.title}" to content version ${m.version}.`);
}

async function seedScenarios(client: PoolClient, log: Log) {
  for (const [i, s] of scenarios.entries()) {
    const problems = validateScript(s.script);
    if (problems.length) throw new Error(`Scenario "${s.slug}" is invalid:\n- ${problems.join('\n- ')}`);
    const { rowCount } = await client.query(
      `INSERT INTO scenarios (slug, module_id, order_index, title, summary, persona, script, sensitive)
       VALUES ($1, (SELECT module_id FROM training_modules WHERE slug = $2), $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO NOTHING`,
      [s.slug, s.moduleSlug, i + 1, s.title, s.summary, JSON.stringify(s.persona), JSON.stringify(s.script), Boolean(s.sensitive)],
    );
    if (rowCount) log(`Seeded scenario "${s.title}".`);
  }
}

async function seedProviders(client: PoolClient, log: Log) {
  let added = 0;
  for (const p of providers) {
    const { rowCount } = await client.query(
      `INSERT INTO providers (name, service_type, description, on_campus, district, location, contact, hours, verified)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8, false
       WHERE NOT EXISTS (SELECT 1 FROM providers WHERE name = $1)`,
      [p.name, p.serviceType, p.description, p.onCampus, p.district, p.location, p.contact, p.hours],
    );
    added += rowCount ?? 0;
  }
  if (added) log(`Added ${added} directory entr${added === 1 ? 'y' : 'ies'}.`);
  // The ALU Wellness Center entry replaces the generic counselling placeholder.
  await client.query("UPDATE providers SET archived = true WHERE name = $1 AND NOT archived", [LEGACY_COUNSELLING_PLACEHOLDER]);
}

export async function seed({ log = console.log as Log } = {}) {
  await withTransaction(async (client) => {
    await seedAccounts(client, log);
    await seedModules(client, log);
    await seedScenarios(client, log);
    await seedProviders(client, log);
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
