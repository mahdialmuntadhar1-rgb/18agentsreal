create extension if not exists pgcrypto;

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  status text not null default 'idle',
  enabled boolean not null default true,
  schedule text not null default 'manual',
  last_run timestamptz,
  records_processed integer not null default 0,
  errors integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_inserted integer not null default 0,
  duplicates_skipped integer not null default 0,
  errors integer not null default 0,
  status text not null,
  log_output text
);

create index if not exists idx_agent_logs_agent_id_started_at
  on public.agent_logs(agent_id, started_at desc);

create table if not exists public.data_quality_reports (
  id uuid primary key default gen_random_uuid(),
  directory_id uuid,
  issue_type text not null,
  issue_details text,
  severity text not null default 'warning',
  reported_by text not null default 'ValidationAgent',
  created_at timestamptz not null default now()
);

create index if not exists idx_quality_reports_issue_type
  on public.data_quality_reports(issue_type);

create index if not exists idx_directory_phone on public.directory(phone);
create index if not exists idx_directory_name_city on public.directory(lower(name), lower(city));
create index if not exists idx_directory_name_coordinates on public.directory(lower(name), latitude, longitude);
