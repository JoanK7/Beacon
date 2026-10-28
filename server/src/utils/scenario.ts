// Pure scenario logic: replay a learner's path through a script, make sure it
// is a real path, and compute an "insight score". Kept free of I/O for testing.
import type { ChoiceQuality, ScenarioEnding, ScenarioScript } from '../content/types';

export interface PathStep {
  nodeId: string;
  choice: number;
}

export interface ScenarioResult {
  /** 0-100: share of moments where the learner's FIRST choice was helpful (okay counts half). */
  insightScore: number;
  ending: ScenarioEnding;
  /** How many times the learner tried a different response after an unhelpful one. */
  retries: number;
}

const POINTS: Record<ChoiceQuality, number> = { helpful: 2, okay: 1, unhelpful: 0 };

export class InvalidPathError extends Error {}

/**
 * Walk the script following `path`. Unhelpful choices without a `next` keep the
 * learner on the same node (a retry). The path must end on an ending node.
 */
export function replayScenario(script: ScenarioScript, path: PathStep[]): ScenarioResult {
  let current = script.start;
  const firstChoice = new Map<string, ChoiceQuality>();
  let retries = 0;

  for (const step of path) {
    if (step.nodeId !== current) throw new InvalidPathError(`Expected node "${current}" but got "${step.nodeId}".`);
    const node = script.nodes[current];
    if (!node || node.kind !== 'step') throw new InvalidPathError(`Node "${current}" is not a step.`);
    const choice = node.choices[step.choice];
    if (!choice) throw new InvalidPathError(`Choice ${step.choice} does not exist at "${current}".`);

    if (!firstChoice.has(current)) firstChoice.set(current, choice.quality);
    else retries += 1;

    if (choice.next) current = choice.next;
  }

  const ending = script.nodes[current];
  if (!ending || ending.kind !== 'ending') throw new InvalidPathError('The scenario was not finished.');

  const qualities = [...firstChoice.values()];
  const earned = qualities.reduce((sum, q) => sum + POINTS[q], 0);
  const insightScore = qualities.length ? Math.round((earned / (qualities.length * POINTS.helpful)) * 100) : 0;
  return { insightScore, ending, retries };
}

/** Structural check used by tests and the seed: every link resolves and every path can finish. */
export function validateScript(script: ScenarioScript): string[] {
  const problems: string[] = [];
  if (!script.nodes[script.start]) problems.push(`Start node "${script.start}" is missing.`);
  for (const [id, node] of Object.entries(script.nodes)) {
    if (node.kind !== 'step') continue;
    if (!node.choices.length) problems.push(`"${id}" has no choices.`);
    if (!node.choices.some((c) => c.next)) problems.push(`"${id}" has no way forward.`);
    for (const c of node.choices) {
      if (c.next && !script.nodes[c.next]) problems.push(`"${id}" links to missing node "${c.next}".`);
      if (!c.next && c.quality !== 'unhelpful') problems.push(`"${id}": only unhelpful choices may loop back.`);
    }
  }
  return problems;
}
