// Guards the authored training content so edits can't silently break the app.
import { modules } from '../../src/content/modules';
import { scenarios } from '../../src/content/scenarios';
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
    // The first two questions are used by the skill check.
    expect(m.quiz.length).toBeGreaterThanOrEqual(2);
  });

  it.each(modules.map((m) => [m.slug, m] as const))('%s uses valid lesson formatting', (_slug, m) => {
    for (const s of m.sections) expect([s.heading, validateMarkup(s.body)]).toEqual([s.heading, []]);
    expect(m.version).toBeGreaterThanOrEqual(1);
  });

  it('does not always put the correct answer in the same position', () => {
    const positions = new Set(modules.flatMap((m) => m.quiz.map((q) => q.answerIndex)));
    expect(positions.size).toBeGreaterThan(1);
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
