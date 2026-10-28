// Guards the authored training content so edits can't silently break the app.
import { modules } from '../../src/content/modules';
import { scenarios } from '../../src/content/scenarios';
import * as schemas from '../../src/schemas';
import { validateScript, replayScenario } from '../../src/utils/scenario';
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

  it('does not always put the correct answer in the same position', () => {
    const positions = new Set(modules.flatMap((m) => m.quiz.map((q) => q.answerIndex)));
    expect(positions.size).toBeGreaterThan(1);
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
