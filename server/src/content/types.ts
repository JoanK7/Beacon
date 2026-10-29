// Shapes for authored training content (modules and scenario role-plays).

export type ChoiceQuality = 'helpful' | 'okay' | 'unhelpful';

export interface ScenarioChoice {
  /** What the learner says or does. */
  text: string;
  quality: ChoiceQuality;
  /** How the simulated peer reacts (shown before Bea's feedback). */
  reaction?: string;
  /** Bea's explanation, linking the choice back to the training. */
  feedback: string;
  /** Next node. Omitted for unhelpful choices: the learner retries the same moment. */
  next?: string;
}

export interface ScenarioStep {
  kind: 'step';
  /** Optional scene-setting line (narration). */
  scene?: string;
  /** What the peer says at this moment. */
  says?: string;
  choices: ScenarioChoice[];
}

export interface ScenarioEnding {
  kind: 'ending';
  title: string;
  text: string;
  /** Training ideas this scenario practised, shown as chips at the end. */
  skills: string[];
}

export type ScenarioNode = ScenarioStep | ScenarioEnding;

export interface ScenarioScript {
  start: string;
  nodes: Record<string, ScenarioNode>;
}

export interface ScenarioPersona {
  name: string;
  /** One-line context, e.g. "First-year student". */
  context: string;
  /** Visual tone for the avatar bubble. */
  tone: 'sky' | 'mint' | 'coral' | 'lavender' | 'sunshine';
}

export interface ScenarioContent {
  slug: string;
  moduleSlug: string;
  title: string;
  summary: string;
  persona: ScenarioPersona;
  /** Involves risk to life: shown with a care note, can be switched off by admins. */
  sensitive?: boolean;
  script: ScenarioScript;
}

export interface ModuleContent {
  slug: string;
  title: string;
  topic: string;
  summary: string;
  estimatedMinutes: number;
  /**
   * Bump when the module text changes. On the next deploy the seed copies the
   * new text into the database, unless an admin has edited the module.
   * Keep the number of sections the same so learners' progress is unaffected.
   */
  version: number;
  /** Section bodies use the lesson markup described in docs/design/style-guide.md. */
  sections: { heading: string; body: string }[];
  /** The first two questions double as the skill-check items for this module. */
  quiz: { prompt: string; options: string[]; answerIndex: number; explanation: string }[];
}
