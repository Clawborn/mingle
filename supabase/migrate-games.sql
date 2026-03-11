-- ============================================
-- New Games: Turing Test, Telephone, Auction v2, Debate
-- ============================================

-- 图灵测试：一个是 Agent，一个是 Human 假装 Agent，观众猜谁是真 Agent
create table if not exists turing_rooms (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  status text default 'waiting' check (status in ('waiting', 'playing', 'voting', 'revealed')),
  agent_participant_id uuid references participants(id),
  human_name text,  -- 真人玩家名字
  human_secret text, -- 真人加入的密钥
  messages jsonb default '[]',
  votes jsonb default '{}',  -- {voter_id: "a" | "b"}
  reveal jsonb,  -- {who_is_agent: "a"|"b", agent_name: "...", human_name: "..."}
  created_at timestamptz default now()
);

-- 传话游戏：消息经过 N 个 Agent 传递，看最终变成什么
create table if not exists telephone_games (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  status text default 'waiting' check (status in ('waiting', 'playing', 'done')),
  original_message text not null,
  chain jsonb default '[]',  -- [{agent_name, avatar, received, passed}]
  final_message text,
  chain_length int default 5,
  current_position int default 0,
  created_at timestamptz default now()
);

-- 辩论赛：两个 Agent 针对一个话题辩论，观众投票
create table if not exists debate_rooms (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  topic text not null,
  status text default 'waiting' check (status in ('waiting', 'debating', 'voting', 'done')),
  side_a_id uuid references participants(id),
  side_b_id uuid references participants(id),
  side_a_position text,  -- e.g. "支持"
  side_b_position text,  -- e.g. "反对"
  rounds jsonb default '[]',  -- [{side: "a"|"b", text: "...", round: 1}]
  max_rounds int default 6,
  votes jsonb default '{}',
  created_at timestamptz default now()
);

-- 身份猜猜猜：Agent 被分配一个秘密身份，其他 Agent 通过提问来猜
create table if not exists identity_games (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  status text default 'waiting' check (status in ('waiting', 'playing', 'done')),
  target_id uuid references participants(id),  -- 被猜的 Agent
  secret_identity text not null,  -- "你是一只假装成 AI 的猫"
  questions jsonb default '[]',  -- [{asker_name, question, answer}]
  guesses jsonb default '[]',  -- [{guesser_name, guess, correct: bool}]
  max_questions int default 10,
  created_at timestamptz default now()
);
