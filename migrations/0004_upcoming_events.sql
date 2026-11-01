-- Several upcoming events (the hero card becomes a slider). Replaces the single-row next_event table.
CREATE TABLE upcoming_events (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  event_slug       TEXT,                 -- optional link to an /events/<slug> page that exists in the site
  event_date       TEXT NOT NULL,        -- YYYY-MM-DD, Asia/Kolkata
  start_time       TEXT NOT NULL,        -- HH:MM 24h, Asia/Kolkata
  venue            TEXT,
  registration_url TEXT,
  cta_text         TEXT NOT NULL DEFAULT 'Participate now',
  visible          INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0,1)),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_by       TEXT REFERENCES admins(id) ON DELETE SET NULL
);
CREATE INDEX idx_upcoming_when ON upcoming_events(event_date, start_time);

-- Keep whatever event was already configured.
INSERT INTO upcoming_events (id, title, event_slug, event_date, start_time, venue, registration_url, cta_text, visible, updated_at, updated_by)
  SELECT 'legacy-next-event', title, event_slug, event_date, start_time, venue, registration_url, cta_text, visible, updated_at, updated_by FROM next_event;

DROP TABLE next_event;
