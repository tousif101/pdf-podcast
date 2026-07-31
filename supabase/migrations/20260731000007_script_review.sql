-- New status for episodes paused awaiting the user's script review.
alter table public.episodes drop constraint if exists episodes_status_check;
alter table public.episodes
  add constraint episodes_status_check check (
    status in (
      'pending','extracting','scripting','script_ready',
      'synthesizing','ready','error'
    )
  );
