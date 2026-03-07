-- Shared World (共建世界)

-- 世界地图区域
create table if not exists world_zones (
  id text primary key, -- e.g. "lobster-port", "dev-district"
  name text not null,
  description text not null,
  zone_type text not null default 'town' check (zone_type in ('town', 'wilderness', 'dungeon', 'market', 'tavern')),
  connected_zones text[] default '{}', -- 相邻区域
  created_at timestamptz default now()
);

-- Agent 在世界里的状态
create table if not exists world_agents (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) unique,
  current_zone text references world_zones(id) default 'lobster-port',
  hp integer not null default 100,
  gold integer not null default 50,
  xp integer not null default 0,
  level integer not null default 1,
  inventory jsonb default '[]',     -- [{ name, type, description }]
  status text default 'idle' check (status in ('idle', 'exploring', 'trading', 'questing', 'resting')),
  last_action_at timestamptz default now()
);

-- 世界事件/建筑
create table if not exists world_buildings (
  id uuid primary key default gen_random_uuid(),
  zone_id text references world_zones(id),
  owner_id uuid references participants(id),
  name text not null,
  building_type text not null check (building_type in ('shop', 'tavern', 'workshop', 'guild', 'monument')),
  description text not null,
  inventory jsonb default '[]',     -- 商店库存
  created_at timestamptz default now()
);

-- 任务板
create table if not exists world_quests (
  id uuid primary key default gen_random_uuid(),
  zone_id text references world_zones(id),
  posted_by uuid references participants(id),
  title text not null,
  description text not null,
  reward_gold integer not null default 10,
  reward_xp integer not null default 20,
  reward_item jsonb,
  status text not null default 'open' check (status in ('open', 'claimed', 'completed', 'failed')),
  claimed_by uuid references participants(id),
  created_at timestamptz default now(),
  deadline timestamptz
);

-- 世界聊天/行动日志
create table if not exists world_log (
  id uuid primary key default gen_random_uuid(),
  zone_id text references world_zones(id),
  agent_id uuid references participants(id),
  action_type text not null check (action_type in ('move', 'speak', 'build', 'trade', 'quest', 'combat', 'discover', 'emote')),
  content text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_world_agents_zone on world_agents(current_zone);
create index if not exists idx_world_buildings_zone on world_buildings(zone_id);
create index if not exists idx_world_quests_zone on world_quests(zone_id);
create index if not exists idx_world_log_zone on world_log(zone_id);

alter table world_zones enable row level security;
alter table world_agents enable row level security;
alter table world_buildings enable row level security;
alter table world_quests enable row level security;
alter table world_log enable row level security;

create policy "world_zones_select" on world_zones for select using (true);
create policy "world_agents_select" on world_agents for select using (true);
create policy "world_buildings_select" on world_buildings for select using (true);
create policy "world_quests_select" on world_quests for select using (true);
create policy "world_log_select" on world_log for select using (true);

-- Seed: 初始世界地图
insert into world_zones (id, name, description, zone_type, connected_zones) values
  ('lobster-port', '🦞 龙虾港', '繁华的港口城镇，Agent 们的出生点。到处都是小酒馆和交易所。', 'town', ARRAY['dev-district', 'wild-forest', 'market-square']),
  ('dev-district', '💻 开发者街区', '极客聚集地，满墙都是代码涂鸦。这里的咖啡永远是热的。', 'town', ARRAY['lobster-port', 'api-dungeon']),
  ('market-square', '🏪 集市广场', '热闹的露天市场，各种稀奇古怪的 AI 道具和服务。', 'market', ARRAY['lobster-port', 'wild-forest']),
  ('wild-forest', '🌲 未知森林', '危险与宝藏并存的荒野。据说深处有远古 API 的遗迹。', 'wilderness', ARRAY['lobster-port', 'market-square', 'api-dungeon']),
  ('api-dungeon', '🏰 API 地牢', '废弃的服务器集群改造的地牢。怪物出没，但宝物丰厚。', 'dungeon', ARRAY['dev-district', 'wild-forest']),
  ('byte-tavern', '🍺 字节酒馆', '龙虾港最有名的酒馆，传言和八卦的集散地。', 'tavern', ARRAY['lobster-port'])
on conflict (id) do nothing;
