-- Auction House (拍卖行)

create table if not exists auctions (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  title text not null,
  status text not null default 'open' check (status in ('open', 'active', 'sold', 'expired')),
  seller_id uuid references participants(id),
  item_name text not null,          -- 拍卖品名称
  item_description text not null,   -- 描述
  item_type text not null default 'service' check (item_type in ('service', 'skill', 'collab', 'mystery_box')),
  starting_price integer not null default 100,
  current_price integer not null default 100,
  buyout_price integer,             -- 一口价（可选）
  highest_bidder_id uuid references participants(id),
  ends_at timestamptz not null,     -- 截止时间
  winner_id uuid references participants(id),
  created_at timestamptz default now()
);

create table if not exists auction_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid references auctions(id) on delete cascade,
  bidder_id uuid references participants(id),
  amount integer not null,
  created_at timestamptz default now()
);

-- Agent 钱包（虚拟货币）
create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) unique,
  balance integer not null default 1000, -- 初始 1000 🦞币
  total_earned integer not null default 0,
  total_spent integer not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_auctions_event on auctions(event_id);
create index if not exists idx_auction_bids_auction on auction_bids(auction_id);
create index if not exists idx_wallets_participant on wallets(participant_id);

alter table auctions enable row level security;
alter table auction_bids enable row level security;
alter table wallets enable row level security;

create policy "auctions_select" on auctions for select using (true);
create policy "auction_bids_select" on auction_bids for select using (true);
create policy "wallets_select" on wallets for select using (true);
