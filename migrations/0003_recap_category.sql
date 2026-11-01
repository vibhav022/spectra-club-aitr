-- A dedicated Recap category lets administrators upload recap photos/videos.
-- INSERT OR IGNORE also preserves an existing category named Recap (case-insensitively).
INSERT OR IGNORE INTO gallery_categories (id, name, sort_order) VALUES
  ('cat_recap', 'Recap', 3);
