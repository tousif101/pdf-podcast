create table if not exists public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  reason text not null check (reason in ('signup','generation','purchase','refund','admin')),
  ref text unique,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_idx
  on public.credit_ledger (user_id, created_at desc);

alter table public.credit_ledger enable row level security;

drop policy if exists "ledger owner select" on public.credit_ledger;
create policy "ledger owner select" on public.credit_ledger
  for select to authenticated
  using (auth.uid() = user_id);
-- No insert/update/delete policies: writes go through the secret key or the
-- security-definer functions below only.

create or replace function public.credit_balance(p_user uuid)
returns bigint
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(delta), 0) from credit_ledger where user_id = p_user;
$$;

-- Atomic spend: serializes per user so concurrent uploads can't both pass the
-- balance check. Re-running with the same ref (workflow retry) is a no-op
-- success rather than a double charge.
create or replace function public.spend_credits(
  p_user uuid,
  p_amount integer,
  p_ref text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount < 1 then
    return false;
  end if;
  perform pg_advisory_xact_lock(hashtext('credits:' || p_user::text));
  if exists (select 1 from credit_ledger where ref = p_ref) then
    return true;
  end if;
  if (select coalesce(sum(delta), 0) from credit_ledger where user_id = p_user) < p_amount then
    return false;
  end if;
  insert into credit_ledger (user_id, delta, reason, ref)
  values (p_user, -p_amount, 'generation', p_ref);
  return true;
end;
$$;

-- Refunds exactly what was spent on an episode, once. No-op if nothing was
-- spent (admin generations) or if already refunded.
create or replace function public.refund_episode(p_user uuid, p_episode uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into credit_ledger (user_id, delta, reason, ref)
  select l.user_id, -l.delta, 'refund', 'refund:episode:' || p_episode
  from credit_ledger l
  where l.ref = 'episode:' || p_episode and l.user_id = p_user and l.delta < 0
  on conflict (ref) do nothing;
$$;

-- Every new account starts with 5 free credits; the unique ref makes the
-- grant impossible to repeat.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.credit_ledger (user_id, delta, reason, ref)
  values (new.id, 5, 'signup', 'signup:' || new.id)
  on conflict (ref) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
