import type { PathStep } from '../src/utils/scenario';
import type { ScenarioScript } from '../src/content/types';

/** Follow the first helpful choice at every step: the "ideal" path. */
export function helpfulPath(script: ScenarioScript): PathStep[] {
  const path: PathStep[] = [];
  let id = script.start;
  for (let guard = 0; guard < 50; guard++) {
    const node = script.nodes[id];
    if (!node || node.kind === 'ending') return path;
    const choice = node.choices.findIndex((c) => c.quality === 'helpful');
    path.push({ nodeId: id, choice });
    id = node.choices[choice]!.next!;
  }
  throw new Error('Scenario never ends');
}
