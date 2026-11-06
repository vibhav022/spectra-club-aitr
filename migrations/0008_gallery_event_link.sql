-- Link gallery photos and videos to catalogue events.
-- NULL means the item is not associated with a specific event.

ALTER TABLE gallery_items
ADD COLUMN event_id TEXT REFERENCES site_events(id) ON DELETE SET NULL;

CREATE INDEX idx_gallery_items_event_id
ON gallery_items(event_id);