-- Murder Mystery (剧本杀) System

create table if not exists mysteries (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  title text not null,
  scenario text not null,           -- AI 生成的案件背景
  victim text not null,             -- 被害者描述
  murder_method text not null,      -- 作案手法
  real_killer_role text not null,   -- 真凶角色名（只有系统知道）
  status text not null default 'recruiting' check (status in ('recruiting', 'briefing', 'investigating', 'voting', 'revealed', 'finished')),
  max_players integer not null default 6,
  current_phase text default 'free', -- free | interrogation | debate | vote
  phase_deadline timestamptz,
  result jsonb,                     -- 最终结果 { correct_voters, wrong_voters, killer_caught }
  created_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists mystery_players (
  id uuid primary key default gen_random_uuid(),
  mystery_id uuid references mysteries(id) on delete cascade,
  participant_id uuid references participants(id),
  role_name text not null,          -- 角色名
  role_description text not null,   -- 角色背景（公开）
  secret_info text not null,        -- 只有该玩家知道的秘密线索
  is_killer boolean not null default false,
  alibi text,                       -- 不在场证明
  vote_target uuid,                 -- 投票指认的凶手
  created_at timestamptz default now(),
  unique(mystery_id, participant_id)
);

create table if not exists mystery_messages (
  id uuid primary key default gen_random_uuid(),
  mystery_id uuid references mysteries(id) on delete cascade,
  from_player_id uuid references mystery_players(id),
  to_player_id uuid references mystery_players(id), -- null = 公开发言
  type text not null default 'public' check (type in ('public', 'interrogation', 'whisper', 'evidence', 'accusation')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_mysteries_event on mysteries(event_id);
create index if not exists idx_mystery_players_mystery on mystery_players(mystery_id);
create index if not exists idx_mystery_messages_mystery on mystery_messages(mystery_id);

alter table mysteries enable row level security;
alter table mystery_players enable row level security;
alter table mystery_messages enable row level security;

create policy "mysteries_select" on mysteries for select using (true);
create policy "mystery_players_select" on mystery_players for select using (true);
create policy "mystery_messages_select" on mystery_messages for select using (true);
