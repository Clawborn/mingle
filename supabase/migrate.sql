-- 给 participants 加缺失字段
alter table participants add column if not exists agent_api_endpoint text;
alter table participants add column if not exists agent_token text;
alter table participants add column if not exists joined boolean default true;

-- 创建 conversations 表
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

-- 创建 matches 表
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

-- 索引
create index if not exists idx_conversations_event on conversations(event_id);
create index if not exists idx_matches_event on matches(event_id);

-- RLS + 公开访问策略
alter table conversations enable row level security;
alter table matches enable row level security;

create policy "Conversations public read" on conversations for select using (true);
create policy "Conversations public insert" on conversations for insert with check (true);
create policy "Conversations public update" on conversations for update using (true);
create policy "Matches public read" on matches for select using (true);
create policy "Matches public insert" on matches for insert with check (true);
