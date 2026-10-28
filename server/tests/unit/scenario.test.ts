import { replayScenario, validateScript, InvalidPathError } from '../../src/utils/scenario';
import type { ScenarioScript } from '../../src/content/types';

const script: ScenarioScript = {
  start: 'a',
  nodes: {
    a: {
      kind: 'step',
      says: 'Hi',
      choices: [
        { text: 'unhelpful', quality: 'unhelpful', feedback: 'try again' },
        { text: 'helpful', quality: 'helpful', feedback: 'good', next: 'b' },
        { text: 'okay', quality: 'okay', feedback: 'fine', next: 'b' },
      ],
    },
    b: {
      kind: 'step',
      says: 'Thanks',
      choices: [{ text: 'helpful', quality: 'helpful', feedback: 'good', next: 'end' }],
    },
    end: { kind: 'ending', title: 'Done', text: 'Well done', skills: ['Listening'] },
  },
};

describe('replayScenario', () => {
  it('scores an all-helpful path as 100 with no retries', () => {
    const r = replayScenario(script, [
      { nodeId: 'a', choice: 1 },
      { nodeId: 'b', choice: 0 },
    ]);
    expect(r).toMatchObject({ insightScore: 100, retries: 0 });
    expect(r.ending.title).toBe('Done');
  });

  it('keeps the learner on the same step after an unhelpful choice, and only scores the first try', () => {
    const r = replayScenario(script, [
      { nodeId: 'a', choice: 0 },
      { nodeId: 'a', choice: 1 },
      { nodeId: 'b', choice: 0 },
    ]);
    // First try at "a" was unhelpful (0 of 2), at "b" helpful (2 of 2) => 50%.
    expect(r).toMatchObject({ insightScore: 50, retries: 1 });
  });

  it('gives half credit for an okay choice', () => {
    const r = replayScenario(script, [
      { nodeId: 'a', choice: 2 },
      { nodeId: 'b', choice: 0 },
    ]);
    expect(r.insightScore).toBe(75);
  });

  it('rejects paths that skip steps, use missing choices, or stop early', () => {
    expect(() => replayScenario(script, [{ nodeId: 'b', choice: 0 }])).toThrow(InvalidPathError);
    expect(() => replayScenario(script, [{ nodeId: 'a', choice: 9 }])).toThrow(InvalidPathError);
    expect(() => replayScenario(script, [{ nodeId: 'a', choice: 1 }])).toThrow(/not finished/);
  });
});

describe('validateScript', () => {
  it('accepts a well-formed script', () => {
    expect(validateScript(script)).toEqual([]);
  });

  it('reports broken links and non-unhelpful dead ends', () => {
    const broken: ScenarioScript = {
      start: 'a',
      nodes: {
        a: {
          kind: 'step',
          choices: [
            { text: 'x', quality: 'helpful', feedback: '', next: 'missing' },
            { text: 'y', quality: 'okay', feedback: '' },
          ],
        },
      },
    };
    const problems = validateScript(broken);
    expect(problems.join(' ')).toMatch(/missing node "missing"/);
    expect(problems.join(' ')).toMatch(/only unhelpful choices may loop back/);
  });
});
