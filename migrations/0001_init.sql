-- Spectra admin schema. Applied with `wrangler d1 migrations apply`.
PRAGMA foreign_keys = ON;

CREATE TABLE admins (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  disabled      INTEGER NOT NULL DEFAULT 0 CHECK (disabled IN (0,1)),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_login_at TEXT
);
-- Hard cap: this club has exactly three administrators.
CREATE TRIGGER admins_max_three BEFORE INSERT ON admins
WHEN (SELECT COUNT(*) FROM admins) >= 3
BEGIN SELECT RAISE(ABORT, 'Maximum of 3 administrator accounts reached'); END;

CREATE TABLE sessions (
  id           TEXT PRIMARY KEY,               -- SHA-256 of the cookie token (the token itself is never stored)
  admin_id     TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL,               -- epoch seconds
  expires_at   INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  user_agent   TEXT,
  ip           TEXT
);
CREATE INDEX idx_sessions_admin ON sessions(admin_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE TABLE rate_limits (
  key          TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL
);

-- Every file in R2 has a row here. status: pending (upload started) | ready | deleting (queued for R2 removal)
CREATE TABLE media (
  id            TEXT PRIMARY KEY,
  object_key    TEXT NOT NULL UNIQUE,
  kind          TEXT NOT NULL CHECK (kind IN ('image','video')),
  content_type  TEXT NOT NULL,
  size_bytes    INTEGER NOT NULL DEFAULT 0,
  declared_size INTEGER NOT NULL DEFAULT 0,
  width         INTEGER,
  height        INTEGER,
  original_name TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','deleting')),
  created_by    TEXT REFERENCES admins(id) ON DELETE SET NULL,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX idx_media_status ON media(status, created_at);

CREATE TABLE team_members (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  role           TEXT NOT NULL CHECK (length(role) BETWEEN 1 AND 120),
  tier           TEXT NOT NULL CHECK (tier IN ('leadership','core')),
  instagram      TEXT,
  photo_media_id TEXT REFERENCES media(id) ON DELETE SET NULL,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  visible        INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0,1)),
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_team_order ON team_members(sort_order);

CREATE TABLE faculty (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  designation    TEXT NOT NULL CHECK (length(designation) BETWEEN 1 AND 120),
  department     TEXT,
  photo_media_id TEXT REFERENCES media(id) ON DELETE SET NULL,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  visible        INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0,1)),
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_faculty_order ON faculty(sort_order);

CREATE TABLE gallery_categories (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (length(name) BETWEEN 1 AND 40),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE gallery_items (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  caption         TEXT,
  category_id     TEXT NOT NULL REFERENCES gallery_categories(id) ON DELETE RESTRICT,
  media_id        TEXT NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
  thumb_media_id  TEXT REFERENCES media(id) ON DELETE SET NULL,
  kind            TEXT NOT NULL CHECK (kind IN ('image','video')),
  width           INTEGER NOT NULL DEFAULT 800,
  height          INTEGER NOT NULL DEFAULT 600,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  visible         INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0,1)),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_gallery_order ON gallery_items(sort_order);
CREATE INDEX idx_gallery_category ON gallery_items(category_id);

-- Single-row table (id is always 1). Visibility can be toggled without losing the details.
CREATE TABLE next_event (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  title            TEXT NOT NULL,
  event_slug       TEXT,                 -- optional link to an /events/<slug> page that exists in the site
  event_date       TEXT NOT NULL,        -- YYYY-MM-DD, Asia/Kolkata
  start_time       TEXT NOT NULL,        -- HH:MM 24h, Asia/Kolkata
  venue            TEXT,
  registration_url TEXT,
  cta_text         TEXT NOT NULL DEFAULT 'Participate now',
  visible          INTEGER NOT NULL DEFAULT 0 CHECK (visible IN (0,1)),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_by       TEXT REFERENCES admins(id) ON DELETE SET NULL
);

-- Records which seed items were ever imported, so re-running the seed never duplicates
-- records and never brings back something an administrator deleted.
CREATE TABLE seed_log (
  seed_key    TEXT PRIMARY KEY,
  imported_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
