-- Final version: verified directory details, quiz question banks, learning
-- quality measures, daily stories and the anonymous community wall.

-- Directory -------------------------------------------------------------------
ALTER TABLE providers ADD COLUMN email TEXT NOT NULL DEFAULT '';
ALTER TABLE providers ADD COLUMN website TEXT NOT NULL DEFAULT '';
-- Set when an admin saves the entry; the seed then never overwrites it.
ALTER TABLE providers ADD COLUMN admin_edited BOOLEAN NOT NULL DEFAULT false;

-- Quizzes: a bank of questions, of which each attempt shows a few -------------
ALTER TABLE quizzes ADD COLUMN questions_per_attempt INTEGER NOT NULL DEFAULT 5
  CHECK (questions_per_attempt BETWEEN 1 AND 50);
-- The skill check has its own questions, never shown in quizzes.
ALTER TABLE quizzes ADD COLUMN skill_questions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- An attempt is created when the quiz is opened (the server picks the
-- questions) and scored when submitted, so score and passed start empty.
ALTER TABLE quiz_attempts ALTER COLUMN score DROP NOT NULL;
ALTER TABLE quiz_attempts ALTER COLUMN passed DROP NOT NULL;
ALTER TABLE quiz_attempts ADD COLUMN mode TEXT NOT NULL DEFAULT 'first' CHECK (mode IN ('first', 'new', 'repeat'));
ALTER TABLE quiz_attempts ADD COLUMN question_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
-- option_orders[i][p] = the original option shown at position p of question i.
ALTER TABLE quiz_attempts ADD COLUMN option_orders JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE quiz_attempts ADD COLUMN started_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE quiz_attempts ADD COLUMN submitted_at TIMESTAMPTZ;
ALTER TABLE quiz_attempts ADD COLUMN rushed BOOLEAN NOT NULL DEFAULT false;
UPDATE quiz_attempts SET submitted_at = created_at, started_at = created_at; -- older attempts were all submitted

-- Reading pace ----------------------------------------------------------------
-- When the learner last opened or progressed in a module: the server measures
-- reading time from here, so it cannot be faked by the browser.
CREATE TABLE module_activity (
  user_id       INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  module_id     INTEGER NOT NULL REFERENCES training_modules(module_id) ON DELETE CASCADE,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, module_id)
);
ALTER TABLE section_views ADD COLUMN dwell_seconds INTEGER;
ALTER TABLE section_views ADD COLUMN rushed BOOLEAN NOT NULL DEFAULT false;

-- Daily stories ---------------------------------------------------------------
CREATE TABLE stories (
  story_id     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  reflection   TEXT NOT NULL,
  module_slug  TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE story_reads (
  user_id   INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  story_id  INTEGER NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
  read_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, story_id)
);

-- Anonymous community wall ------------------------------------------------------
-- user_id is kept so authors can delete their posts and so account deletion
-- removes them; it is never returned by the API.
CREATE TABLE mood_posts (
  post_id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  mood           SMALLINT NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note           TEXT NOT NULL DEFAULT '' CHECK (char_length(note) <= 280),
  needs_care     BOOLEAN NOT NULL DEFAULT false, -- note mentioned possible risk
  hidden         BOOLEAN NOT NULL DEFAULT false, -- hidden by reports or an admin
  admin_cleared  BOOLEAN NOT NULL DEFAULT false, -- an admin restored it: reports no longer hide it
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mood_posts_recent ON mood_posts(created_at DESC) WHERE NOT hidden;

CREATE TABLE mood_supports (
  post_id     INTEGER NOT NULL REFERENCES mood_posts(post_id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('hug', 'here_for_you', 'you_got_this', 'reach_out')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, kind)
);

CREATE TABLE mood_reports (
  post_id     INTEGER NOT NULL REFERENCES mood_posts(post_id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
