create table if not exists public.episodes (
  id uuid primary key,
  title text not null,
  source_filename text not null,
  status text not null default 'pending'
    check (status in ('pending','extracting','scripting','synthesizing','ready','error')),
  error text,
  created_at timestamptz not null default now(),
  total_pages integer,
  extracted_chars integer,
  script jsonb,
  audio_mime_type text,
  audio_url text,
  duration_seconds integer,
  providers jsonb
);

create index if not exists episodes_created_at_idx
  on public.episodes (created_at desc);

-- Server-only access via the secret (service-role) key; no anon/authenticated
-- policies, so the publishable key cannot read or write anything.
alter table public.episodes enable row level security;
