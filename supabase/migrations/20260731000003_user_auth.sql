alter table public.episodes
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists episodes_user_idx
  on public.episodes (user_id, created_at desc);

-- Owner-scoped access for the publishable key; server routes use the secret
-- key (bypasses RLS) and filter explicitly. Legacy rows (user_id is null)
-- stay reachable only via the secret key / admin path.
drop policy if exists "episodes owner select" on public.episodes;
create policy "episodes owner select" on public.episodes
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "episodes owner delete" on public.episodes;
create policy "episodes owner delete" on public.episodes
  for delete to authenticated
  using (auth.uid() = user_id);
