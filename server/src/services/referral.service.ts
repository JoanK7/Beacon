// Referral & Directory Service (FR5, FR6).
import * as db from '../db/pool';
import { encrypt, decrypt } from '../utils/crypto';
import { notFound, badRequest } from '../utils/http-error';

export interface ProviderRow {
  provider_id: number;
  name: string;
  service_type: string;
  description: string;
  on_campus: boolean;
  district: string;
  location: string;
  contact: string;
  hours: string;
  verified: boolean;
  archived: boolean;
  updated_at: Date;
}

export function toProvider(r: ProviderRow) {
  return {
    id: r.provider_id,
    name: r.name,
    serviceType: r.service_type,
    description: r.description,
    onCampus: r.on_campus,
    district: r.district,
    location: r.location,
    contact: r.contact,
    hours: r.hours,
    verified: r.verified,
    archived: r.archived,
    updatedAt: r.updated_at,
  };
}

/** Escape LIKE wildcards so user input is matched literally. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export interface ProviderSearch {
  q?: string;
  category?: string;
  onCampus?: boolean;
  includeArchived?: boolean;
}

export async function searchProviders({ q, category, onCampus, includeArchived = false }: ProviderSearch) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (!includeArchived) where.push('NOT archived');
  if (q) {
    params.push(`%${escapeLike(q)}%`);
    const p = `$${params.length}`;
    where.push(`(name ILIKE ${p} OR description ILIKE ${p} OR location ILIKE ${p} OR district ILIKE ${p})`);
  }
  if (category) {
    params.push(category);
    where.push(`service_type = $${params.length}`);
  }
  if (onCampus !== undefined) {
    params.push(onCampus);
    where.push(`on_campus = $${params.length}`);
  }
  const sql = `SELECT * FROM providers ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
               ORDER BY (service_type = 'emergency') DESC, on_campus DESC, name`;
  const { rows } = await db.query<ProviderRow>(sql, params);
  return rows.map(toProvider);
}

export async function getProvider(id: number) {
  const { rows } = await db.query<ProviderRow>('SELECT * FROM providers WHERE provider_id = $1 AND NOT archived', [id]);
  if (!rows[0]) throw notFound('That service is not in the directory.');
  return toProvider(rows[0]);
}

// Support sessions ----------------------------------------------------------

export async function listSessions(userId: number) {
  const { rows } = await db.query<{
    session_id: number;
    category: string;
    notes_enc: string | null;
    outcome: string;
    created_at: Date;
    referral_id: number | null;
    referral_status: string | null;
    provider_id: number | null;
    provider_name: string | null;
    provider_type: string | null;
  }>(
    `SELECT s.*, r.referral_id, r.status AS referral_status, p.provider_id, p.name AS provider_name,
            p.service_type AS provider_type
     FROM support_sessions s
     LEFT JOIN referrals r ON r.session_id = s.session_id
     LEFT JOIN providers p ON p.provider_id = r.provider_id
     WHERE s.user_id = $1
     ORDER BY s.created_at DESC`,
    [userId],
  );
  return rows.map((r) => ({
    id: r.session_id,
    category: r.category,
    notes: decrypt(r.notes_enc),
    outcome: r.outcome,
    createdAt: r.created_at,
    referral: r.referral_id
      ? { id: r.referral_id, status: r.referral_status, providerId: r.provider_id, providerName: r.provider_name, providerType: r.provider_type }
      : null,
  }));
}

export interface NewSession {
  category: string;
  notes?: string;
  outcome: string;
  providerId?: number | null;
}

/** Log a support session and, optionally, the referral made during it. */
export async function logSession(userId: number, { category, notes, outcome, providerId }: NewSession) {
  return db.withTransaction(async (client) => {
    if (providerId) {
      const provider = await client.query('SELECT 1 FROM providers WHERE provider_id = $1 AND NOT archived', [providerId]);
      if (!provider.rowCount) throw badRequest('The selected service is no longer in the directory.');
    }
    const { rows } = await client.query<{ session_id: number; created_at: Date }>(
      `INSERT INTO support_sessions (user_id, category, notes_enc, outcome)
       VALUES ($1, $2, $3, $4) RETURNING session_id, created_at`,
      [userId, category, encrypt(notes), outcome],
    );
    const session = rows[0]!;
    if (providerId) {
      await client.query('INSERT INTO referrals (session_id, provider_id) VALUES ($1, $2)', [session.session_id, providerId]);
    }
    return { id: session.session_id, createdAt: session.created_at };
  });
}

export async function deleteSession(userId: number, sessionId: number) {
  const { rowCount } = await db.query('DELETE FROM support_sessions WHERE session_id = $1 AND user_id = $2', [sessionId, userId]);
  if (!rowCount) throw notFound('Session not found.');
}
