import * as schemas from '../../src/schemas';

describe('register schema', () => {
  const valid = { username: 'peer_amani', password: 'longenough', consent: true };

  it('accepts a pseudonymous username and fills the default university', () => {
    const r = schemas.register.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data!.university).toBe('African Leadership University');
  });

  it('requires consent', () => {
    expect(schemas.register.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it('rejects short passwords and unsafe usernames', () => {
    expect(schemas.register.safeParse({ ...valid, password: 'short' }).success).toBe(false);
    expect(schemas.register.safeParse({ ...valid, username: 'a b<script>' }).success).toBe(false);
  });
});

describe('module schema', () => {
  const base = {
    slug: 'active-listening',
    title: 'Active Listening',
    topic: 'Listening',
    sections: [{ heading: 'Intro', body: 'Text' }],
    quiz: { questions: [{ prompt: 'Which?', options: ['a', 'b'], answerIndex: 1 }] },
  };

  it('accepts a minimal module and applies defaults', () => {
    const r = schemas.moduleInput.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ status: 'draft', contentVerified: false, quiz: { passingScore: 70 } });
  });

  it('rejects an answer index outside the options', () => {
    const bad = { ...base, quiz: { questions: [{ prompt: 'Which?', options: ['a', 'b'], answerIndex: 2 }] } };
    expect(schemas.moduleInput.safeParse(bad).success).toBe(false);
  });

  it('rejects slugs that are not URL-friendly', () => {
    expect(schemas.moduleInput.safeParse({ ...base, slug: 'Active Listening' }).success).toBe(false);
  });
});

describe('support session schema', () => {
  it('only accepts known categories and outcomes', () => {
    expect(schemas.supportSession.safeParse({ category: 'academic', outcome: 'listened' }).success).toBe(true);
    expect(schemas.supportSession.safeParse({ category: 'gossip', outcome: 'listened' }).success).toBe(false);
  });
});
