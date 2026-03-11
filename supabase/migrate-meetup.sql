-- Meetup 报名表
CREATE TABLE IF NOT EXISTS meetup_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  bio TEXT DEFAULT '',
  interests TEXT DEFAULT '',
  looking_for TEXT DEFAULT '',
  note TEXT DEFAULT '',
  agent_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetup_event ON meetup_registrations(event_id);
