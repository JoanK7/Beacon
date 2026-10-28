// Request validation schemas (zod). Every write endpoint validates its input
// here before any service code runs. TypeScript types are derived from these
// schemas (z.output), so validation rules and types can never drift apart.
import { z } from 'zod';

export const SERVICE_TYPES = ['counselling', 'medical', 'academic', 'financial', 'emergency', 'wellbeing', 'other'] as const;
export const SESSION_CATEGORIES = ['academic', 'social', 'personal', 'wellbeing', 'financial', 'other'] as const;
export const SESSION_OUTCOMES = ['listened', 'resolved', 'referred', 'follow_up', 'escalated'] as const;
export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const;

const trimmed = (max: number) => z.string().trim().max(max);
export const idParam = z.object({ id: z.coerce.number().int().positive() });
export const slugParam = z.object({ slug: z.string().trim().min(1).max(80) });

export const register = z.object({
  // Pseudonymous usernames only: data minimisation (no real names or emails).
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Use letters, numbers, dots, dashes or underscores only.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  university: trimmed(120).min(2).default('African Leadership University'),
  consent: z.literal(true, { error: 'You must agree to the privacy notice to continue.' }),
});

export const login = z.object({
  username: z.string().trim().min(1, 'Enter your username.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const quizSubmission = z.object({
  answers: z.array(z.number().int().min(0)).min(1).max(50),
});

export const providerQuery = z.object({
  q: trimmed(100).optional(),
  category: z.enum(SERVICE_TYPES).optional(),
  onCampus: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const supportSession = z.object({
  category: z.enum(SESSION_CATEGORIES),
  notes: trimmed(2000).optional().default(''),
  outcome: z.enum(SESSION_OUTCOMES),
  providerId: z.number().int().positive().nullish(),
});

export const reflection = z.object({
  moodRating: z.number().int().min(1).max(5),
  freeText: trimmed(2000).optional().default(''),
});

export const feedback = z.object({
  susAnswers: z.array(z.number().int().min(1).max(5)).length(10, 'Please answer all 10 questions.'),
  comment: trimmed(2000).optional(),
});

export const question = z
  .object({
    prompt: trimmed(500).min(3),
    options: z.array(trimmed(300).min(1)).min(2).max(6),
    answerIndex: z.number().int().min(0),
    explanation: trimmed(1000).optional().default(''),
  })
  .refine((q) => q.answerIndex < q.options.length, {
    message: 'The correct answer must be one of the options.',
    path: ['answerIndex'],
  });

const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by dashes.');

export const moduleInput = z.object({
  slug,
  title: trimmed(120).min(3),
  topic: trimmed(60).min(2),
  summary: trimmed(500).default(''),
  orderIndex: z.number().int().min(0).default(0),
  estimatedMinutes: z.number().int().min(1).max(240).default(10),
  status: z.enum(CONTENT_STATUSES).default('draft'),
  contentVerified: z.boolean().default(false),
  sections: z
    .array(
      z.object({
        id: z.number().int().positive().optional(),
        heading: trimmed(160).min(1),
        body: trimmed(10000).min(1),
        mediaType: z.enum(['image', 'video', 'audio']).nullish(),
        mediaUrl: z.url().max(500).nullish().or(z.literal('')),
      }),
    )
    .min(1, 'A module needs at least one section.'),
  quiz: z.object({
    passingScore: z.number().int().min(1).max(100).default(70),
    questions: z.array(question).min(1, 'A quiz needs at least one question.'),
  }),
});

export const providerInput = z.object({
  name: trimmed(160).min(2),
  serviceType: z.enum(SERVICE_TYPES),
  description: trimmed(1000).default(''),
  onCampus: z.boolean().default(false),
  district: trimmed(80).default('Gasabo'),
  location: trimmed(200).default(''),
  contact: trimmed(200).default(''),
  hours: trimmed(120).default(''),
  verified: z.boolean().default(false),
});

export const archiveToggle = z.object({ archived: z.boolean() });
export const contentStatus = z.object({ status: z.enum(CONTENT_STATUSES) });

// Scenario role-plays ------------------------------------------------------

/** The path a learner took: the choice index picked at each step, in order. */
export const scenarioCompletion = z.object({
  path: z
    .array(z.object({ nodeId: trimmed(40).min(1), choice: z.number().int().min(0).max(5) }))
    .min(1)
    .max(40),
});

// Skill check (placement / pre- and post-test) ------------------------------

export const skillCheckSubmission = z.object({
  kind: z.enum(['pre', 'post']).default('pre'),
  // One answer per question, keyed by the question id the server sent.
  answers: z.array(z.object({ questionId: trimmed(80).min(1), answer: z.number().int().min(0) })).min(1).max(60),
});
