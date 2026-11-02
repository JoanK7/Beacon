// Guards the authored training content so edits can't silently break the app.
import { modules } from '../../src/content/modules';
import { scenarios } from '../../src/content/scenarios';
import { providers } from '../../src/content/providers';
import { stories } from '../../src/content/stories';
import { QUESTIONS_PER_ATTEMPT } from '../../src/db/seed';
import * as schemas from '../../src/schemas';
import { validateScript, replayScenario } from '../../src/utils/scenario';
import { validateMarkup } from '../../src/content/markup-check';
import { helpfulPath } from '../helpers';

describe('training modules', () => {
  it('has unique slugs', () => {
    const slugs = modules.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(modules.map((m) => [m.slug, m] as const))('%s passes the admin validation rules', (_slug, m) => {
    const result = schemas.moduleInput.safeParse({ ...m, status: 'published', sections: m.sections, quiz: { questions: m.quiz } });
    expect(result.success).toBe(true);
  });

  it.each(modules.map((m) => [m.slug, m] as const))('%s has a bank of 10 quiz questions and 2 skill-check questions', (_slug, m) => {
    expect(m.quiz).toHaveLength(10);
    expect(m.quiz.length).toBeGreaterThanOrEqual(QUESTIONS_PER_ATTEMPT * 2); // so a "new quiz" can be fully different
    expect(m.skillCheck).toHaveLength(2);
    for (const q of [...m.quiz, ...m.skillCheck]) {
      expect(schemas.question.safeParse(q).success).toBe(true);
      expect(q.explanation.length).toBeGreaterThan(10);
    }
  });

  it('gives every question a unique, stable id', () => {
    const ids = modules.flatMap((m) => [...m.quiz, ...m.skillCheck].map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never reuses a quiz question in the skill check (or the other way round)', () => {
    const quizPrompts = new Set(modules.flatMap((m) => m.quiz.map((q) => q.prompt)));
    const skillPrompts = modules.flatMap((m) => m.skillCheck.map((q) => q.prompt));
    expect(skillPrompts.filter((p) => quizPrompts.has(p))).toEqual([]);
    expect(new Set(quizPrompts).size).toBe(modules.reduce((n, m) => n + m.quiz.length, 0)); // no duplicate prompts
  });

  it.each(modules.map((m) => [m.slug, m] as const))('%s uses valid lesson formatting', (_slug, m) => {
    for (const s of m.sections) expect([s.heading, validateMarkup(s.body)]).toEqual([s.heading, []]);
    expect(m.version).toBeGreaterThanOrEqual(1);
  });

  it('does not always put the correct answer in the same position', () => {
    const positions = new Set(modules.flatMap((m) => [...m.quiz, ...m.skillCheck].map((q) => q.answerIndex)));
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe('directory entries', () => {
  it('are final: no placeholders or details still to be confirmed', () => {
    expect(JSON.stringify(providers)).not.toMatch(/placeholder|to be (confirmed|verified)|pending/i);
  });

  it('show opening hours only for services outside ALU', () => {
    for (const p of providers) {
      if (p.name.startsWith('ALU')) expect([p.name, p.hours]).toEqual([p.name, '']);
    }
    expect(providers.find((p) => p.name === 'Solid Minds Counselling Clinic')!.hours).not.toBe('');
  });

  it('have valid email addresses and secure web addresses', () => {
    for (const p of providers) {
      const result = schemas.providerInput.safeParse(p);
      expect([p.name, result.success]).toEqual([p.name, true]);
    }
  });
});

describe('daily stories', () => {
  it('have unique slugs, valid formatting and link to a real module', () => {
    expect(new Set(stories.map((s) => s.slug)).size).toBe(stories.length);
    const slugs = new Set(modules.map((m) => m.slug));
    for (const s of stories) {
      expect([s.slug, validateMarkup(s.body)]).toEqual([s.slug, []]);
      expect(slugs.has(s.moduleSlug)).toBe(true);
      expect(s.reflection).toMatch(/\?$/);
    }
  });
});

describe('lesson markup checker', () => {
  const lines = (...l: string[]) => l.join('\n');

  it('accepts every kind of block', () => {
    const body = [
      'A paragraph with a **key term**.',
      lines('- a bullet', '- another'),
      lines('1. first step', '2. second step'),
      '> Tip: be kind to yourself.',
      lines('+ P | Presence', '+ E | Empathy'),
      lines('? Which helps?', '[ ] Rushing', '[x] Listening', '= Listening comes first.'),
      lines('?? What would you say?', '= Something gentle.'),
    ].join('\n\n');
    expect(validateMarkup(body)).toEqual([]);
  });

  it.each([
    ['unmatched bold', 'A **key term without an end', /unmatched \*\*/],
    ['unknown callout', '> Note: hello', /callouts start with/],
    ['card without a back', lines('+ P | Presence', '+ E'), /each card/],
    ['check with no correct answer', lines('? Q', '[ ] a', '[ ] b', '= why'), /exactly one correct/],
    ['check with two correct answers', lines('? Q', '[x] a', '[x] b', '= why'), /exactly one correct/],
    ['check without explanation', lines('? Q', '[ ] a', '[x] b'), /explanation/],
    ['check with a stray line', lines('? Q', '[ ] a', '[x] b', '- c', '= why'), /unexpected line/],
    ['reveal without answer', '?? What would you say?', /suggested answer/],
  ])('flags %s', (_name, body, message) => {
    expect(validateMarkup(body).join(' ')).toMatch(message);
  });
});

describe('scenario scripts', () => {
  it.each(scenarios.map((s) => [s.slug, s] as const))('%s is well-formed and completable', (_slug, s) => {
    expect(validateScript(s.script)).toEqual([]);
    expect(modules.map((m) => m.slug)).toContain(s.moduleSlug);
    const result = replayScenario(s.script, helpfulPath(s.script));
    expect(result.insightScore).toBe(100);
  });

  it('gives every step at least one helpful choice', () => {
    for (const s of scenarios) {
      for (const node of Object.values(s.script.nodes)) {
        if (node.kind === 'step') expect(node.choices.some((c) => c.quality === 'helpful')).toBe(true);
      }
    }
  });
});
