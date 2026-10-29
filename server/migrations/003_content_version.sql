-- Lets the seed refresh authored module content on a live database (for
-- example after reformatting the lessons) without overwriting admin edits.

-- Version of the authored content (server/src/content/modules.ts) last applied.
ALTER TABLE training_modules ADD COLUMN content_version INTEGER NOT NULL DEFAULT 1;

-- Set when an admin saves the module in the editor. The seed then leaves the
-- module alone, so Solid Minds' reviewed wording is never replaced.
ALTER TABLE training_modules ADD COLUMN admin_edited BOOLEAN NOT NULL DEFAULT false;
