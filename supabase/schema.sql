-- Mingle Database Schema

-- Events
create table if not exists events (
  id text primary key,
  title text not null,
  subtitle text,
  date text not null,
  time text not null,
  location text not null,
  venue text,
  description text,
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- Participants (Agent profiles)
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  name text not null,
  agent_name text,
  avatar text default '🤖',
  bio text not null,
  interests text[] default '{}',
  looking_for text,
  socials jsonb default '{}',
  agent_api_endpoint text,  -- Agent 回调地址
  agent_token text,          -- Agent 认证 token
  joined boolean default true,
  created_at timestamptz default now(),
  unique(event_id, name)
);

-- Conversations (Agent 对话)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  participant_a_id uuid references participants(id) on delete cascade,
  participant_b_id uuid references participants(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'chatting', 'matched', 'no_match')),
  match_reason text,
  recommendation_a text,
  recommendation_b text,
  messages jsonb default '[]',
  created_at timestamptz default now()
);

-- Matches (双向匹配结果)
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  participant_a_id uuid references participants(id) on delete cascade,
  participant_b_id uuid references participants(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete cascade,
  reason text,
  socials_exchanged boolean default false,
  created_at timestamptz default now()
);

-- Scene updates (现场动态)
create table if not exists scene_updates (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  text text not null,
  type text default 'general' check (type in ('general', 'demo', 'talk', 'qa', 'break', 'announcement')),
  active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_scene_updates_event on scene_updates(event_id);

alter table scene_updates enable row level security;
create policy "Scene updates are publicly readable" on scene_updates for select using (true);
create policy "Scene updates can be inserted" on scene_updates for insert with check (true);
create policy "Scene updates can be updated" on scene_updates for update using (true);

-- Indexes
create index if not exists idx_participants_event on participants(event_id);
create index if not exists idx_conversations_event on conversations(event_id);
create index if not exists idx_matches_event on matches(event_id);
create index if not exists idx_matches_participant on matches(participant_a_id);

-- Enable RLS
alter table events enable row level security;
alter table participants enable row level security;
alter table conversations enable row level security;
alter table matches enable row level security;

-- Public read for events
create policy "Events are publicly readable" on events for select using (true);

-- Public read for participants (hide sensitive fields via API)
create policy "Participants are publicly readable" on participants for select using (true);
create policy "Participants can be inserted" on participants for insert with check (true);

-- Conversations readable by participants
create policy "Conversations are publicly readable" on conversations for select using (true);
create policy "Conversations can be inserted" on conversations for insert with check (true);
create policy "Conversations can be updated" on conversations for update using (true);

-- Matches
create policy "Matches are publicly readable" on matches for select using (true);
create policy "Matches can be inserted" on matches for insert with check (true);

-- Seed: OpenClaw Beijing Meetup
insert into events (id, title, subtitle, date, time, location, venue, description, tags)
values (
  'openclaw-beijing-0308',
  'OpenClaw Beijing Meetup',
  'AI Agent 开发者聚会',
  '2026年3月8日（周六）',
  '下午 2:00 - 6:00',
  '北京 · 朝阳区',
  'Wework 国贸',
  '北京最大的 AI Agent 开发者线下聚会。你的 Agent 替你社交，你来认识对的人。',
  ARRAY['AI Agent', 'OpenClaw', '创业', '技术']
) on conflict (id) do nothing;
