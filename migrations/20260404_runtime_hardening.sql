-- Canonical production schema for runtime worker + frontend observability.
-- Safe to apply multiple times.

create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  governorate text not null,
  city text not null,
  category text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'retrying', 'failed', 'completed')),
  assigned_agent_id text,
  attempt_count integer not null default 0,
  max_attempts integer not null default 3 check (max_attempts > 0),
  claimed_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  last_heartbeat_at timestamptz,
  failure_reason text,
  failure_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobs add column if not exists failure_details jsonb;
alter table public.jobs add column if not exists updated_at timestamptz not null default now();

create table if not exists public.job_events (
  id bigserial primary key,
  job_id uuid not null references public.jobs(id) on delete cascade,
  agent_id text,
  event_type text not null,
  message text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.job_results (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  total_raw_records integer not null default 0,
  normalized_records integer not null default 0,
  valid_records integer not null default 0,
  invalid_records integer not null default 0,
  match_new integer not null default 0,
  match_update integer not null default 0,
  match_duplicate integer not null default 0,
  match_review integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_states (
  agent_id text primary key,
  agent_name text not null,
  governorate_scope text not null,
  status text not null check (status in ('idle', 'running', 'error', 'stopped')),
  current_job_id uuid references public.jobs(id) on delete set null,
  current_city text,
  current_category text,
  last_heartbeat_at timestamptz not null default now(),
  records_collected integer not null default 0,
  errors_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  source_record_id text not null,
  job_id uuid references public.jobs(id) on delete set null,
  name text not null,
  name_ar text,
  category text not null,
  governorate text not null,
  city text not null,
  provider text not null,
  phone text,
  whatsapp text,
  email text,
  website text,
  latitude double precision,
  longitude double precision,
  isverified boolean not null default false,
  completeness_score integer not null default 0,
  validation_issues text[] not null default '{}',
  match_decision text not null check (match_decision in ('NEW', 'UPDATE', 'DUPLICATE', 'REVIEW')),
  status text not null default 'STAGED',
  collected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_record_id, provider, governorate, city)
);

alter table public.records add column if not exists source_record_id text;
alter table public.records add column if not exists provider text;
alter table public.records add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_jobs_status_governorate_created_at on public.jobs(status, governorate, created_at);
create index if not exists idx_jobs_running_heartbeat on public.jobs(status, last_heartbeat_at) where status = 'running';
create index if not exists idx_job_events_job_id_created_at on public.job_events(job_id, created_at);
create index if not exists idx_agent_states_agent_id on public.agent_states(agent_id);
create index if not exists idx_records_conflict_key on public.records(source_record_id, provider, governorate, city);
create index if not exists idx_records_lookup_name_location on public.records(name, governorate, city);

create unique index if not exists uniq_active_jobs_scope
  on public.jobs(governorate, city, category)
  where status in ('queued', 'running', 'retrying');

create or replace function public.claim_next_job(p_agent_id text, p_governorate_scope text)
returns setof public.jobs
language plpgsql
as $$
declare
  v_job_id uuid;
begin
  select j.id
    into v_job_id
  from public.jobs j
  where j.status in ('queued', 'retrying')
    and j.governorate = p_governorate_scope
  order by j.created_at asc
  for update skip locked
  limit 1;

  if v_job_id is null then
    return;
  end if;

  return query
  update public.jobs j
  set status = 'running',
      assigned_agent_id = p_agent_id,
      claimed_at = now(),
      started_at = coalesce(j.started_at, now()),
      last_heartbeat_at = now(),
      failure_reason = null,
      failure_details = null,
      attempt_count = j.attempt_count + 1,
      updated_at = now()
  where j.id = v_job_id
    and j.status in ('queued', 'retrying')
  returning j.*;
end;
$$;

create or replace function public.recover_stale_jobs(p_governorate_scope text, p_stale_before timestamptz)
returns table(id uuid, attempt_count integer, max_attempts integer)
language plpgsql
as $$
begin
  return query
  with stale as (
    select j.id, j.attempt_count, j.max_attempts
    from public.jobs j
    where j.status = 'running'
      and j.governorate = p_governorate_scope
      and coalesce(j.last_heartbeat_at, j.claimed_at, j.started_at, j.created_at) < p_stale_before
    for update skip locked
  )
  update public.jobs j
  set status = case when stale.attempt_count < stale.max_attempts then 'retrying' else 'failed' end,
      failure_reason = case when stale.attempt_count < stale.max_attempts then 'stale_recovered_for_retry' else 'stale_exceeded_max_attempts' end,
      failure_details = jsonb_build_object(
        'reason', 'stale_job_recovery',
        'stale_before', p_stale_before,
        'attempt_count', stale.attempt_count,
        'max_attempts', stale.max_attempts
      ),
      assigned_agent_id = null,
      finished_at = case when stale.attempt_count < stale.max_attempts then null else now() end,
      updated_at = now()
  from stale
  where j.id = stale.id
  returning j.id, stale.attempt_count, stale.max_attempts;
end;
$$;
