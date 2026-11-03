
-- Full Spectra event catalogue.
-- Upcoming homepage countdown events remain in their existing table.

CREATE TABLE site_events (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  title           TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  category        TEXT NOT NULL,
  description     TEXT NOT NULL CHECK (length(description) BETWEEN 1 AND 3000),

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

  created_at      TEXT NOT NULL DEFAULT
                  (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  updated_at      TEXT NOT NULL DEFAULT
                  (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_site_events_order
ON site_events(sort_order, created_at);

CREATE INDEX idx_site_events_visible
ON site_events(visible, sort_order);
