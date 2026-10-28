import { encrypt, decrypt, generateToken, hashToken } from '../../src/utils/crypto';

describe('field encryption', () => {
  it('round-trips text', () => {
    const secret = 'Peer felt overwhelmed by exams.';
    expect(decrypt(encrypt(secret))).toBe(secret);
  });

  it('never stores plain text and uses a fresh IV each time', () => {
    const a = encrypt('same input');
    const b = encrypt('same input');
    expect(a).not.toContain('same input');
    expect(a).not.toBe(b);
  });

  it('keeps empty values as null', () => {
    expect(encrypt('')).toBeNull();
    expect(encrypt(null)).toBeNull();
    expect(decrypt(null)).toBeNull();
  });

  it('detects tampering', () => {
    const parts = encrypt('hello')!.split(':');
    parts[3] = Buffer.from('jello').toString('base64');
    expect(() => decrypt(parts.join(':'))).toThrow();
  });
});

describe('session tokens', () => {
  it('generates unique URL-safe tokens', () => {
    const t = generateToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateToken()).not.toBe(t);
  });

  it('hashes deterministically', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe('abc');
  });
});
