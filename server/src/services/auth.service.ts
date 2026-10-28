// Authentication & Session Handler Service (FR1).
import bcrypt from 'bcryptjs';
import config from '../config';
import * as db from '../db/pool';
import { generateToken, hashToken } from '../utils/crypto';
import { conflict, unauthorized } from '../utils/http-error';
import type { PublicUser, Role } from '../types';

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync('beacon-timing-equaliser', BCRYPT_ROUNDS);

interface UserRow {
  user_id: number;
  username: string;
  password_hash: string;
  role: Role;
  university: string;
  created_at: Date;
}

export function publicUser(row: UserRow): PublicUser {
  return {
    id: row.user_id,
    username: row.username,
    role: row.role,
    university: row.university,
    createdAt: row.created_at,
  };
}

async function createSession(userId: number) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + config.sessionTtlHours * 3600 * 1000);
  await db.query('INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [
    userId,
    hashToken(token),
    expiresAt,
  ]);
  return { token, expiresAt };
}

export async function register({ username, password, university }: { username: string; password: string; university: string }) {
  const existing = await db.query('SELECT 1 FROM users WHERE lower(username) = lower($1)', [username]);
  if (existing.rowCount) throw conflict('That username is taken. Please choose another.');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { rows } = await db.query<UserRow>(
    `INSERT INTO users (username, password_hash, role, university, consent_at)
     VALUES ($1, $2, 'peer', $3, now()) RETURNING *`,
    [username, passwordHash, university],
  );
  const row = rows[0]!;
  const session = await createSession(row.user_id);
  return { user: publicUser(row), ...session };
}

export async function login({ username, password }: { username: string; password: string }) {
  const { rows } = await db.query<UserRow>('SELECT * FROM users WHERE lower(username) = lower($1)', [username]);
  const user = rows[0];
  // Compare even when the user is missing so response time does not reveal valid usernames.
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) throw unauthorized('Username or password is incorrect.');
  const session = await createSession(user.user_id);
  return { user: publicUser(user), ...session };
}

export async function logout(token: string) {
  await db.query('DELETE FROM auth_sessions WHERE token_hash = $1', [hashToken(token)]);
}

export async function findUserBySessionToken(token: string): Promise<PublicUser | null> {
  const { rows } = await db.query<UserRow>(
    `SELECT u.* FROM auth_sessions s JOIN users u ON u.user_id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)],
  );
  return rows[0] ? publicUser(rows[0]) : null;
}

/** Right to erasure (Law No. 058/2021): cascades to all of the user's records. */
export async function deleteAccount(userId: number) {
  await db.query('DELETE FROM users WHERE user_id = $1', [userId]);
}
