-- Initial gallery categories. Maintained afterwards from the dashboard (Gallery > Categories).
INSERT OR IGNORE INTO gallery_categories (id, name, sort_order) VALUES
  ('cat_tech', 'Tech', 0),
  ('cat_cultural', 'Cultural', 1),
  ('cat_community', 'Community', 2);
