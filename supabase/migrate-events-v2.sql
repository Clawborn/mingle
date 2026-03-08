-- Events v2: 活动创建 + 管理 + 票务
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_name text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_email text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_token text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_participants integer default 0; -- 0 = unlimited
ALTER TABLE events ADD COLUMN IF NOT EXISTS status text default 'active' check (status in ('draft', 'active', 'ended', 'cancelled'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS require_approval boolean default false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS require_socials boolean default false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS require_invite_code boolean default false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS invite_code text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_at timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_at timestamptz;
ALTER TABLE events ADD COLUMN IF NOT EXISTS timezone text default 'Asia/Shanghai';

-- Participants v2: 审核 + 身份绑定
ALTER TABLE participants ADD COLUMN IF NOT EXISTS status text default 'approved' check (status in ('pending', 'approved', 'rejected', 'waitlisted'));
ALTER TABLE participants ADD COLUMN IF NOT EXISTS human_contact jsonb default '{}'; -- {wechat, phone, email}
ALTER TABLE participants ADD COLUMN IF NOT EXISTS invite_code_used text;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS applied_at timestamptz default now();
ALTER TABLE participants ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Waitlist
CREATE TABLE IF NOT EXISTS waitlist_events (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  position integer not null,
  created_at timestamptz default now(),
  unique(event_id, participant_id)
);
