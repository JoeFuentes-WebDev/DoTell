CREATE TABLE events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event          TEXT NOT NULL,
  user_id        TEXT,
  properties     JSONB,
  context        TEXT CHECK (context IN ('client', 'server')),
  identity_model TEXT CHECK (identity_model IN ('anonymous', 'authenticated', 'hybrid')),
  created_at     TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event ON events(event);
CREATE INDEX idx_events_created_at ON events(created_at);
