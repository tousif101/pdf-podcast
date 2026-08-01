-- Opt-in public share link. Null unless the owner has shared the episode.
alter table public.episodes
  add column if not exists share_token text unique;
