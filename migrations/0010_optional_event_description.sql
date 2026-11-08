-- Allow catalogue events to have an empty description.
-- Existing event descriptions are preserved.

CREATE TABLE site_events_new (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  title           TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  category        TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 3000),

  event_year      INTEGER,
  event_date      TEXT,
  venue           TEXT,
  instagram_url   TEXT,

  highlights_json TEXT NOT NULL DEFAULT '[]',
  wash            TEXT NOT NULL DEFAULT 'teal'
                  CHECK (wash IN ('magenta', 'blue', 'teal', 'green')),

  poster_media_id TEXT REFERENCES media(id) ON DELETE SET NULL,
  video_media_id  TEXT REFERENCES media(id) ON DELETE SET NULL,

  visible         INTEGER NOT NULL DEFAULT 0
                  CHECK (visible IN (0, 1)),

  sort_order      INTEGER NOT NULL DEFAULT 0,
  
  parent_event_id TEXT REFERENCES site_events_new(id) ON DELETE SET NULL,

  created_at      TEXT NOT NULL DEFAULT
                  (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  updated_at      TEXT NOT NULL DEFAULT
                  (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO site_events_new (
  id, slug, title, category, description,
  event_year, event_date, venue, instagram_url,
  highlights_json, wash, poster_media_id, video_media_id,
  visible, sort_order, parent_event_id, created_at, updated_at
)
SELECT
  id, slug, title, category, description,
  event_year, event_date, venue, instagram_url,
  highlights_json, wash, poster_media_id, video_media_id,
  visible, sort_order, parent_event_id, created_at, updated_at
FROM site_events;
DROP TABLE site_events;

ALTER TABLE site_events_new RENAME TO site_events;

CREATE INDEX idx_site_events_order
ON site_events(sort_order, created_at);

CREATE INDEX idx_site_events_visible
ON site_events(visible, sort_order);

CREATE INDEX idx_site_events_parent
ON site_events(parent_event_id);