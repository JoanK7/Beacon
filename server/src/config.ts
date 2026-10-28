// Centralised, validated configuration. Fails fast on startup if a required
// secret is missing so misconfiguration never reaches users.
//
// `override: true` makes this project's server/.env win over variables already
// set on the machine (e.g. a DATABASE_URL left over from another project).
// It is disabled under Jest (NODE_ENV=test) so tests keep their own settings
// and can never be pointed at the development database. In production there is
// no .env file, so the platform's environment variables are used unchanged.
import dotenv from 'dotenv';

dotenv.config({ quiet: true, override: process.env.NODE_ENV !== 'test' });

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';
const isTest = env === 'test';

function required(name: string, fallbackForDev?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (!isProduction && fallbackForDev !== undefined) return fallbackForDev;
  throw new Error(`Missing required environment variable: ${name}`);
}

// A fixed dev/test key keeps local setup friction-free. Production must
// supply its own 32-byte key (see README).
const DEV_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');

const config = {
  env,
  isProduction,
  isTest,
  port: Number(process.env.PORT) || 4000,
  databaseUrl: required('DATABASE_URL', 'postgres://beacon:beacon@localhost:5433/beacon'),
  databaseSsl: process.env.DATABASE_SSL === 'true',
  encryptionKey: required('ENCRYPTION_KEY', DEV_ENCRYPTION_KEY),
  // Comma-separated list of browser origins allowed to call the API directly.
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  // Number of reverse proxies in front of the API (Express 'trust proxy').
  // 1 = Render only. 2 = Vercel → Render, so rate limits see the real client IP.
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS) || 24 * 7,
  sessionCookieName: 'beacon_session',
} as const;

const keyBytes = Buffer.from(config.encryptionKey, 'base64');
if (keyBytes.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes encoded as base64');
}

export default config;
