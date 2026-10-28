// Minimal forward-only migration runner. Each .sql file in server/migrations
// runs once, in filename order, inside a transaction, and is recorded in
// schema_migrations so re-running is safe.
import fs from 'node:fs';
import path from 'node:path';
import { pool } from './pool';

// server/migrations sits two levels above both src/db (dev) and dist/db (build).
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

type Log = (message: string) => void;

export async function migrate({ log = console.log as Log } = {}): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

  const { rows } = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      log(`Applied migration ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }
  log('Database is up to date.');
}

if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .catch((err: Error) => {
      console.error(err.message);
      process.exit(1);
    });
}
