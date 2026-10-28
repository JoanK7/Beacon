-- Scenario role-plays, the skill check (placement / pre- and post-test) and
-- audio as a section media type.

-- Where a module's content came from (e.g. the Solid Minds training).
ALTER TABLE training_modules ADD COLUMN source_note TEXT;

-- Allow audio alongside images and video (varied content for different learning styles).
ALTER TABLE module_sections DROP CONSTRAINT module_sections_media_type_check;
ALTER TABLE module_sections ADD CONSTRAINT module_sections_media_type_check
  CHECK (media_type IN ('image', 'video', 'audio'));

-- Branching conversations with a simulated peer. The script (steps, choices,
-- reactions, feedback) is stored as JSONB and authored in server/src/content.
CREATE TABLE scenarios (
  scenario_id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  module_id         INTEGER REFERENCES training_modules(module_id) ON DELETE SET NULL,
  order_index       INTEGER NOT NULL DEFAULT 0,
  title             TEXT NOT NULL,
  summary           TEXT NOT NULL DEFAULT '',
  persona           JSONB NOT NULL,
  script            JSONB NOT NULL,
  status            TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  sensitive         BOOLEAN NOT NULL DEFAULT false, -- involves risk to life; admins can switch it off
  content_verified  BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every completed play-through. insight_score rewards choosing a helpful
-- response first time (0-100); retries are never penalised beyond that.
CREATE TABLE scenario_completions (
  completion_id  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  scenario_id    INTEGER NOT NULL REFERENCES scenarios(scenario_id) ON DELETE CASCADE,
  insight_score  INTEGER NOT NULL CHECK (insight_score BETWEEN 0 AND 100),
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scenario_completions_user ON scenario_completions(user_id, scenario_id);

-- Skill check results. 'pre' is taken at first login (placement + RQ3 baseline),
-- 'post' at the end of the pilot. results = per-module {slug, title, correct, total}.
CREATE TABLE skill_check_attempts (
  attempt_id  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('pre', 'post')),
  score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  results     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_skill_check_user ON skill_check_attempts(user_id, kind, created_at DESC);
