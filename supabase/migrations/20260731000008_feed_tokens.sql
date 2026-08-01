-- Per-user private podcast feed token. The token in the URL is the bearer
-- secret (standard for private RSS), so no client policies — server only.
create table if not exists public.feed_tokens (
  token text primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.feed_tokens enable row level security;
