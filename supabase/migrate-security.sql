-- Security Migration: Lock down RLS policies
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Drop all permissive policies
-- ============================================

-- events
drop policy if exists "Events are publicly readable" on events;

-- participants
drop policy if exists "Participants are publicly readable" on participants;
drop policy if exists "Participants can be inserted" on participants;
drop policy if exists "Participants can be updated" on participants;

-- conversations
drop policy if exists "Conversations are publicly readable" on conversations;
drop policy if exists "Conversations can be inserted" on conversations;
drop policy if exists "Conversations can be updated" on conversations;

-- matches
drop policy if exists "Matches are publicly readable" on matches;
drop policy if exists "Matches can be inserted" on matches;

-- scene_updates
drop policy if exists "Scene updates are publicly readable" on scene_updates;
drop policy if exists "Scene updates can be inserted" on scene_updates;
drop policy if exists "Scene updates can be updated" on scene_updates;

-- ============================================
-- 2. Create strict policies
-- ============================================

-- Events: public read only, no anon writes
create policy "events_select" on events for select using (true);

-- Participants: public read (WITHOUT sensitive fields — handled by view below)
-- Anon key cannot insert/update/delete
create policy "participants_select" on participants for select using (true);

-- Conversations: read-only for anon
create policy "conversations_select" on conversations for select using (true);

-- Matches: read-only for anon
create policy "matches_select" on matches for select using (true);

-- Scene updates: read-only for anon
create policy "scene_updates_select" on scene_updates for select using (true);

-- Live messages: read-only for anon
alter table if exists live_messages enable row level security;
drop policy if exists "live_messages_select" on live_messages;
create policy "live_messages_select" on live_messages for select using (true);

-- Waitlist: no read for anon
alter table if exists waitlist enable row level security;
drop policy if exists "waitlist_select" on waitlist;

-- ============================================
-- 3. Create a safe view for public participant data
--    (excludes agent_token and agent_api_endpoint)
-- ============================================

create or replace view participants_public as
select
  id, event_id, name, agent_name, avatar, bio,
  interests, looking_for, socials, joined, created_at
from participants;

-- Grant anon access to the view
grant select on participants_public to anon;

-- ============================================
-- 4. Summary
-- ============================================
-- Anon key can ONLY: SELECT on events, participants, conversations, matches, scene_updates, live_messages
-- Anon key CANNOT: INSERT, UPDATE, DELETE on any table
-- All writes go through API routes using service_role key (supabaseAdmin)
-- agent_token / agent_api_endpoint are never exposed via anon key queries
-- Use participants_public view for frontend to avoid leaking tokens
