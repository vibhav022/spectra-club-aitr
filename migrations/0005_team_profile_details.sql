-- Optional profile details for team members (shown on the public Team page when filled in).
-- All columns are nullable, so every existing row stays valid and renders exactly as before.
-- Numbered 0005 because 0004 is already taken by 0004_upcoming_events.sql.
ALTER TABLE team_members ADD COLUMN bio TEXT;             -- short introduction
ALTER TABLE team_members ADD COLUMN specialization TEXT;  -- technical interests / areas of expertise
ALTER TABLE team_members ADD COLUMN contributions TEXT;   -- contributions to Spectra
ALTER TABLE team_members ADD COLUMN linkedin TEXT;        -- LinkedIn profile URL (http/https, validated by the API)