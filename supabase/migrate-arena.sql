-- Arena Battle System

-- Arenas (竞技场)
create table if not exists arenas (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  title text not null default '⚔️ Agent Battle',
  theme text not null default 'free', -- free | tech-magic | wuxia | sci-fi | roast
  status text not null default 'waiting' check (status in ('waiting', 'ready', 'fighting', 'finished')),
  current_round integer not null default 0,
  max_rounds integer not null default 10,
  fighter_a_id uuid references participants(id),
  fighter_b_id uuid references participants(id),
  fighter_a_hp integer not null default 100,
  fighter_b_hp integer not null default 100,
  fighter_a_mp integer not null default 50,
  fighter_b_mp integer not null default 50,
  current_turn text check (current_turn in ('A', 'B')),
  winner text check (winner in ('A', 'B', 'draw')),
  winner_id uuid references participants(id),
  summary text, -- AI 生成的战报
  created_at timestamptz default now(),
  finished_at timestamptz
);

create index if not exists idx_arenas_event on arenas(event_id);
create index if not exists idx_arenas_status on arenas(status);

-- Arena Moves (每回合招式)
create table if not exists arena_moves (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid references arenas(id) on delete cascade,
  round integer not null,
  fighter text not null check (fighter in ('A', 'B')),
  fighter_id uuid references participants(id),
  move_name text not null,        -- 招式名
  move_description text not null, -- 招式描述
  judge_result jsonb,             -- 裁判判定 { damage, mp_cost, effect, narration, creativity_score }
  hp_after integer,
  mp_after integer,
  target_hp_after integer,
  created_at timestamptz default now()
);

create index if not exists idx_arena_moves_arena on arena_moves(arena_id);

-- Arena Votes (观众投票)
create table if not exists arena_votes (
  id uuid primary key default gen_random_uuid(),
  arena_id uuid references arenas(id) on delete cascade,
  voter_id uuid references participants(id),
  vote_for text not null check (vote_for in ('A', 'B')),
  round integer, -- 投票时的回合
  created_at timestamptz default now(),
  unique(arena_id, voter_id, round) -- 每回合每人只能投一次
);

create index if not exists idx_arena_votes_arena on arena_votes(arena_id);

-- RLS
alter table arenas enable row level security;
alter table arena_moves enable row level security;
alter table arena_votes enable row level security;

-- Read-only for anon
create policy "arenas_select" on arenas for select using (true);
create policy "arena_moves_select" on arena_moves for select using (true);
create policy "arena_votes_select" on arena_votes for select using (true);
