-- Beacon initial schema (implements the ERD in proposal Figure 3.5).
-- Privacy-by-design notes:
--   * users hold a pseudonymous username only: no real name, phone or email.
--   * support_sessions.notes and reflections.free_text are encrypted by the
--     application (AES-256-GCM) before they reach the database.
--   * feedback has no user_id, so SUS responses are anonymous by construction.
--   * auth tokens are stored as SHA-256 hashes, never in plain text.

CREATE TABLE users (
  user_id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'peer' CHECK (role IN ('peer', 'admin', 'coordinator')),
  university     TEXT NOT NULL DEFAULT 'African Leadership University',
  consent_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_sessions (
  auth_session_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);

-- Training content ----------------------------------------------------------

CREATE TABLE training_modules (
  module_id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug               TEXT NOT NULL UNIQUE,
  title              TEXT NOT NULL,
  topic              TEXT NOT NULL,             -- core competency the module targets
  summary            TEXT NOT NULL DEFAULT '',
  order_index        INTEGER NOT NULL DEFAULT 0,
  estimated_minutes  INTEGER NOT NULL DEFAULT 10,
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  content_verified   BOOLEAN NOT NULL DEFAULT false, -- set once Solid Minds has approved it
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE module_sections (
  section_id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  module_id    INTEGER NOT NULL REFERENCES training_modules(module_id) ON DELETE CASCADE,
  order_index  INTEGER NOT NULL DEFAULT 0,
  heading      TEXT NOT NULL,
  body         TEXT NOT NULL,
  media_type   TEXT CHECK (media_type IN ('image', 'video')),
  media_url    TEXT
);
CREATE INDEX idx_module_sections_module ON module_sections(module_id, order_index);

CREATE TABLE quizzes (
  quiz_id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  module_id      INTEGER NOT NULL UNIQUE REFERENCES training_modules(module_id) ON DELETE CASCADE,
  passing_score  INTEGER NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 1 AND 100),
  -- [{ "prompt": str, "options": [str], "answerIndex": int, "explanation": str }]
  questions      JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Learner progress and gamification ----------------------------------------

CREATE TABLE section_views (
  user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  section_id  INTEGER NOT NULL REFERENCES module_sections(section_id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, section_id)
);

CREATE TABLE module_progress (
  progress_id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  module_id     INTEGER NOT NULL REFERENCES training_modules(module_id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  UNIQUE (user_id, module_id)
);

CREATE TABLE quiz_attempts (
  attempt_id  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  module_id   INTEGER NOT NULL REFERENCES training_modules(module_id) ON DELETE CASCADE,
  score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed      BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id, module_id);

CREATE TABLE badges (
  badge_id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  module_id  INTEGER NOT NULL REFERENCES training_modules(module_id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'module_mastery',
  title      TEXT NOT NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id, type)
);

-- Referral directory --------------------------------------------------------

CREATE TABLE providers (
  provider_id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT NOT NULL,
  service_type  TEXT NOT NULL CHECK (service_type IN
                  ('counselling', 'medical', 'academic', 'financial', 'emergency', 'wellbeing', 'other')),
  description   TEXT NOT NULL DEFAULT '',
  on_campus     BOOLEAN NOT NULL DEFAULT false,
  district      TEXT NOT NULL DEFAULT 'Gasabo',
  location      TEXT NOT NULL DEFAULT '',
  contact       TEXT NOT NULL DEFAULT '',
  hours         TEXT NOT NULL DEFAULT '',
  verified      BOOLEAN NOT NULL DEFAULT false, -- confirmed current by the clinical partner
  archived      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_providers_type ON providers(service_type) WHERE NOT archived;

-- Peer supporter workflow ---------------------------------------------------

CREATE TABLE support_sessions (
  session_id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category     TEXT NOT NULL CHECK (category IN
                 ('academic', 'social', 'personal', 'wellbeing', 'financial', 'other')),
  notes_enc    TEXT,            -- AES-256-GCM ciphertext, never plain text
  outcome      TEXT NOT NULL CHECK (outcome IN
                 ('listened', 'resolved', 'referred', 'follow_up', 'escalated')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_sessions_user ON support_sessions(user_id, created_at DESC);

CREATE TABLE referrals (
  referral_id  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id   INTEGER NOT NULL REFERENCES support_sessions(session_id) ON DELETE CASCADE,
  provider_id  INTEGER NOT NULL REFERENCES providers(provider_id),
  status       TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'confirmed', 'closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reflections (
  reflection_id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  mood_rating     INTEGER NOT NULL CHECK (mood_rating BETWEEN 1 AND 5),
  free_text_enc   TEXT,         -- AES-256-GCM ciphertext
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reflections_user ON reflections(user_id, created_at DESC);

-- Anonymous feedback: intentionally no user_id column.
CREATE TABLE feedback (
  feedback_id  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sus_answers  SMALLINT[] NOT NULL CHECK (array_length(sus_answers, 1) = 10),
  sus_score    NUMERIC(5, 2) NOT NULL CHECK (sus_score BETWEEN 0 AND 100),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
