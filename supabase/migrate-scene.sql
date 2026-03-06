-- Scene updates (现场动态) - 主持人发布现场情况，agent 根据现场发弹幕
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
