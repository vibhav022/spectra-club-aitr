-- Support parent events and their individual sub-events.
-- NULL parent_event_id means this is a main/standalone event.

ALTER TABLE site_events
ADD COLUMN parent_event_id TEXT
REFERENCES site_events(id)
ON DELETE SET NULL;

CREATE INDEX idx_site_events_parent
ON site_events(parent_event_id);