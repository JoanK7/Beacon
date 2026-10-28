// Shapes of the Beacon API's JSON responses. Mirrors the server services so
// every page knows exactly what data it receives (dates arrive as ISO strings).

export type Role = 'peer' | 'admin' | 'coordinator';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type ModuleStatus = 'not_started' | 'in_progress' | 'completed';
export type MediaType = 'image' | 'video' | 'audio';
export type ToneName = 'sky' | 'mint' | 'coral' | 'lavender' | 'sunshine';

export interface User {
  id: number;
  username: string;
  role: Role;
  university: string;
  createdAt: string;
}

// Training ---------------------------------------------------------------

export interface ModuleSummary {
  id: number;
  slug: string;
  title: string;
  topic: string;
  summary: string;
  estimatedMinutes: number;
  contentVerified: boolean;
  sectionCount: number;
  sectionsViewed: number;
  status: ModuleStatus;
  hasBadge: boolean;
  scenarioCount: number;
}

export interface ModuleSection {
  id: number;
  heading: string;
  body: string;
  mediaType: MediaType | null;
  mediaUrl: string | null;
  viewed: boolean;
}

export interface ModuleDetail {
  id: number;
  slug: string;
  title: string;
  topic: string;
  summary: string;
  estimatedMinutes: number;
  contentVerified: boolean;
  sourceNote: string | null;
  status: ModuleStatus;
  completedAt: string | null;
  sections: ModuleSection[];
  quiz: { passingScore: number; questionCount: number } | null;
  badge: { title: string; earnedAt: string } | null;
  scenarios: { slug: string; title: string; completed: boolean }[];
}

export interface SectionViewResult {
  sectionsViewed: number;
  sectionCount: number;
  status: ModuleStatus;
}

// Quizzes ------------------------------------------------------------------

export interface Quiz {
  module: { slug: string; title: string };
  passingScore: number;
  bestScore: number | null;
  attempts: number;
  testOut: boolean;
  questions: { index: number; prompt: string; options: string[] }[];
}

export interface QuizResult {
  score: number;
  passed: boolean;
  correctCount: number;
  total: number;
  passingScore: number;
  testedOut: boolean;
  results: { question: number; chosen: number | null; correctIndex: number; correct: boolean; explanation: string }[];
  badge: { title: string; earnedAt: string; isNew: true } | null;
}

// Scenarios ----------------------------------------------------------------

export type ChoiceQuality = 'helpful' | 'okay' | 'unhelpful';

export interface ScenarioChoice {
  text: string;
  quality: ChoiceQuality;
  reaction?: string;
  feedback: string;
  next?: string;
}

export type ScenarioNode =
  | { kind: 'step'; scene?: string; says?: string; choices: ScenarioChoice[] }
  | { kind: 'ending'; title: string; text: string; skills: string[] };

export interface ScenarioPersona {
  name: string;
  context: string;
  tone: ToneName;
}

export interface ScenarioSummary {
  slug: string;
  title: string;
  summary: string;
  persona: ScenarioPersona;
  sensitive: boolean;
  contentVerified: boolean;
  module: { slug: string; title: string; topic: string } | null;
  completed: boolean;
  bestInsight: number | null;
}

export interface ScenarioDetail extends Omit<ScenarioSummary, 'completed' | 'bestInsight'> {
  script: { start: string; nodes: Record<string, ScenarioNode> };
}

export interface ScenarioResult {
  insightScore: number;
  retries: number;
  firstCompletion: boolean;
}

// Skill check --------------------------------------------------------------

export interface SkillReviewItem {
  prompt: string;
  options: string[];
  chosen: number;
  correctIndex: number;
  correct: boolean;
  explanation: string;
}

export interface SkillResult {
  slug: string;
  title: string;
  topic: string;
  correct: number;
  total: number;
  level: 'strong' | 'practise';
  /** Per-question review. Missing on attempts saved before reviews were added. */
  questions?: SkillReviewItem[];
}

export interface SkillSummary {
  score: number;
  results: SkillResult[];
  takenAt: string;
}

export interface SkillCheck {
  questions: { id: string; moduleSlug: string; moduleTitle: string; topic: string; prompt: string; options: string[] }[];
  latest: { pre: SkillSummary | null; post: SkillSummary | null };
}

// Progress -----------------------------------------------------------------

export interface Progress {
  points: number;
  level: number;
  name: string;
  nextLevelAt: number | null;
  progressToNext: number;
  modulesCompleted: number;
  modulesTotal: number;
  sectionsViewed: number;
  sessionsLogged: number;
  referralsMade: number;
  reflectionsWritten: number;
  scenariosCompleted: number;
  scenariosTotal: number;
  badges: { id: number; title: string; type: string; earnedAt: string; moduleSlug: string; topic: string }[];
}

// Directory, sessions, reflections -------------------------------------------

export type ServiceType = 'counselling' | 'medical' | 'academic' | 'financial' | 'emergency' | 'wellbeing' | 'other';

export interface Provider {
  id: number;
  name: string;
  serviceType: ServiceType;
  description: string;
  onCampus: boolean;
  district: string;
  location: string;
  contact: string;
  hours: string;
  verified: boolean;
  archived: boolean;
  updatedAt: string;
}

export type SessionCategory = 'academic' | 'social' | 'personal' | 'wellbeing' | 'financial' | 'other';
export type SessionOutcome = 'listened' | 'resolved' | 'referred' | 'follow_up' | 'escalated';

export interface SupportSession {
  id: number;
  category: SessionCategory;
  notes: string | null;
  outcome: SessionOutcome;
  createdAt: string;
  referral: { id: number; status: string; providerId: number; providerName: string; providerType: ServiceType } | null;
}

export interface Reflection {
  id: number;
  moodRating: number;
  freeText: string | null;
  createdAt: string;
}

// Admin ----------------------------------------------------------------------

export interface AdminModuleRow {
  id: number;
  slug: string;
  title: string;
  topic: string;
  status: ContentStatus;
  contentVerified: boolean;
  orderIndex: number;
  sectionCount: number;
  questionCount: number;
  updatedAt: string;
}

export interface EditableQuestion {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}

export interface EditableSection {
  id?: number;
  heading: string;
  body: string;
  mediaType: MediaType | null;
  mediaUrl: string | null;
}

export interface EditableModule {
  id?: number;
  slug: string;
  title: string;
  topic: string;
  summary: string;
  orderIndex: number | string;
  estimatedMinutes: number | string;
  status: ContentStatus;
  contentVerified: boolean;
  sections: EditableSection[];
  quiz: { passingScore: number | string; questions: EditableQuestion[] };
}

export interface AdminScenarioRow {
  id: number;
  slug: string;
  title: string;
  status: ContentStatus;
  sensitive: boolean;
  contentVerified: boolean;
  moduleTitle: string | null;
  completions: number;
}

// Coordinator dashboard ----------------------------------------------------

export interface LabelCount {
  label: string;
  count: number;
}

export interface CohortDashboard {
  generatedAt: string;
  minGroupSize: number;
  overview: {
    peers: number;
    activeLast14Days: number;
    moduleCompletions: number;
    quizAttempts: number;
    quizPassRate: number | null;
    badgesAwarded: number;
    sessionsLogged: number;
    referralsMade: number;
    scenarioCompletions: number;
  };
  modules: { title: string; slug: string; started: number; completed: number; badges: number; completionRate: number }[];
  sessionsByCategory: LabelCount[];
  sessionOutcomes: LabelCount[];
  referralsByServiceType: LabelCount[];
  wellbeing: { reflections30Days: number; averageMood: number | null };
  usability: { responses: number; averageSus: number | null };
  skillCheck: { prePeople: number; preAverage: number | null; postPeople: number; postAverage: number | null };
  scenarios: { title: string; completions: number }[];
  sessionsPerWeek: { week: string; count: number }[];
}
