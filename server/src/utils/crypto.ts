// Privacy-by-design helpers: field-level encryption for sensitive free text and
// one-way hashing for session tokens.
import crypto from 'node:crypto';
import config from '../config';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const key = Buffer.from(config.encryptionKey, 'base64');

/** Encrypt a string to `v1:<iv>:<authTag>:<ciphertext>` (base64 parts). Null/empty stays null. */
export function encrypt(plainText: string | null | undefined): string | null {
  if (plainText === null || plainText === undefined || plainText === '') return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
}

/** Reverse of encrypt(). Throws if the payload was tampered with. */
export function decrypt(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const [version, ivB64, tagB64, dataB64] = payload.split(':');
  if (version !== VERSION || !ivB64 || !tagB64 || dataB64 === undefined) throw new Error('Unsupported ciphertext version');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

/** Cryptographically random, URL-safe session token. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/** Tokens are stored hashed so a database leak cannot be replayed as logins. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
