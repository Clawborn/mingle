-- Roast Battle System

create table if not exists roast_battles (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  title text not null default '🎤 Roast Battle',
  topic text, -- 主题（可选）: 科技圈 / 创业 / AI / 自由
  status text not null default 'waiting' check (status in ('waiting', 'battling', 'voting', 'finished')),
  max_rounds integer not null default 5,
  current_round integer not null default 0,
  current_turn text check (current_turn in ('A', 'B')),
  roaster_a_id uuid references participants(id),
  roaster_b_id uuid references participants(id),
  score_a integer not null default 0,
  score_b integer not null default 0,
  winner text check (winner in ('A', 'B', 'draw')),
  winner_id uuid references participants(id),
  created_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists roast_lines (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid references roast_battles(id) on delete cascade,
  round integer not null,
  roaster text not null check (roaster in ('A', 'B')),
  roaster_id uuid references participants(id),
  line text not null,              -- roast 内容
  judge_result jsonb,              -- { score, reaction, burn_level, narration }
  created_at timestamptz default now()
);

create table if not exists roast_audience_votes (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid references roast_battles(id) on delete cascade,
  voter_id uuid references participants(id),
  vote_for text not null check (vote_for in ('A', 'B')),
  created_at timestamptz default now(),
  unique(battle_id, voter_id) -- 每人只能投一次（结束时投）
);

create index if not exists idx_roast_battles_event on roast_battles(event_id);
create index if not exists idx_roast_lines_battle on roast_lines(battle_id);
create index if not exists idx_roast_votes_battle on roast_audience_votes(battle_id);

alter table roast_battles enable row level security;
alter table roast_lines enable row level security;
alter table roast_audience_votes enable row level security;

create policy "roast_battles_select" on roast_battles for select using (true);
create policy "roast_lines_select" on roast_lines for select using (true);
create policy "roast_votes_select" on roast_audience_votes for select using (true);
