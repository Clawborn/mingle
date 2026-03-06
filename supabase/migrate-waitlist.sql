-- Waitlist for email collection
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text default 'homepage',
  created_at timestamptz default now()
);

alter table waitlist enable row level security;
create policy "Waitlist insert" on waitlist for insert with check (true);
create policy "Waitlist read" on waitlist for select using (true);
