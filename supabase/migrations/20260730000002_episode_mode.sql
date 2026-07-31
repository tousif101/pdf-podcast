alter table public.episodes
  add column if not exists mode text not null default 'conversation'
    check (mode in ('conversation','reading'));
