-- ============================================================
-- Wedding Live Photo Wall — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── Events ────────────────────────────────────────────────
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,          -- e.g. "sarah-james-2026"
  date        date not null,
  cover_image text,                          -- public storage URL
  created_at  timestamptz default now()
);

-- ── Photos ────────────────────────────────────────────────
create table if not exists photos (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid references events(id) on delete cascade,
  image_url    text not null,                -- public storage URL
  caption      text,
  display_name text,
  created_at   timestamptz default now()
);

-- Index for fast gallery loads (newest first per event)
create index if not exists photos_event_created
  on photos(event_id, created_at desc);

-- ── Row-Level Security ────────────────────────────────────
alter table events enable row level security;
alter table photos enable row level security;

-- Anyone can read events and photos (public gallery)
create policy "Public read events"
  on events for select using (true);

create policy "Public read photos"
  on photos for select using (true);

-- Anyone can insert photos (no auth required for guests)
create policy "Public insert photos"
  on photos for insert with check (true);

-- Only service role (admin) can delete photos
-- Admin uses the service role key via /api/admin route
create policy "Service role delete photos"
  on photos for delete using (auth.role() = 'service_role');

-- ── Auto-delete after 30 days (pg_cron) ───────────────────
-- Enable pg_cron extension in Supabase Dashboard > Extensions first
-- Then uncomment:
--
-- select cron.schedule(
--   'delete-old-photos',
--   '0 3 * * *',   -- 3 AM daily
--   $$delete from photos where created_at < now() - interval '30 days'$$
-- );

-- ── Seed one demo event ───────────────────────────────────
insert into events (title, slug, date, cover_image)
values (
  'Sarah & James',
  'sarah-james',
  '2026-06-15',
  null
)
on conflict (slug) do nothing;
