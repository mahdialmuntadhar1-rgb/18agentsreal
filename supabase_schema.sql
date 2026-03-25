-- Iraq Compass - production schema
-- Run in Supabase SQL editor before starting the app.

create extension if not exists "uuid-ossp";

-- Businesses collected by agents
create table if not exists public.businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  government_rate text,
  city text not null,
  address text,
  phone text,
  website text,
  description text,
  source_url text,
  created_by_agent text,
  verification_status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (name, city)
);

-- Agent registry and runtime state
create table if not exists public.agents (
  id uuid primary key default uuid_generate_v4(),
  agent_name text unique not null,
  category text,
  government_rate text,
  status text default 'idle',
  records_collected integer default 0,
  target integer default 1000,
  errors integer default 0,
  last_run timestamptz,
  updated_at timestamptz default now()
);

-- Queue for background agent work
create table if not exists public.agent_tasks (
  id bigserial primary key,
  agent_id integer,
  agent_name text,
  category text,
  city text,
  government_rate text,
  task_type text default 'gather',
  prompt text,
  status text default 'pending',
  result text,
  assigned_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_agent_tasks_status_created_at
  on public.agent_tasks (status, created_at);

-- Agent execution logs
create table if not exists public.agent_logs (
  id bigserial primary key,
  agent_id uuid references public.agents(id) on delete set null,
  action text not null,
  result text,
  records_added integer default 0,
  records_updated integer default 0,
  record_id text,
  created_at timestamptz default now()
);

-- Concurrency-safe task claim (used by BaseGovernor)
create or replace function public.claim_next_task(agent_name text)
returns setof public.agent_tasks
language plpgsql
as $$
declare
  target_id bigint;
begin
  select id into target_id
  from public.agent_tasks
  where status = 'pending'
  order by created_at
  limit 1
  for update skip locked;

  if target_id is not null then
    return query
    update public.agent_tasks
      set status = 'processing',
          assigned_agent = agent_name,
          updated_at = now()
    where id = target_id
    returning *;
  end if;
end;
$$;

alter table public.businesses enable row level security;
alter table public.agents enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.agent_logs enable row level security;

drop policy if exists "Public Read Businesses" on public.businesses;
drop policy if exists "Public Read Agents" on public.agents;
drop policy if exists "Public Read Tasks" on public.agent_tasks;
drop policy if exists "Public Read Logs" on public.agent_logs;

create policy "Public Read Businesses" on public.businesses for select using (true);
create policy "Public Read Agents" on public.agents for select using (true);
create policy "Public Read Tasks" on public.agent_tasks for select using (true);
create policy "Public Read Logs" on public.agent_logs for select using (true);

drop policy if exists "Admin All Businesses" on public.businesses;
drop policy if exists "Admin All Agents" on public.agents;
drop policy if exists "Admin All Tasks" on public.agent_tasks;
drop policy if exists "Admin All Logs" on public.agent_logs;

create policy "Admin All Businesses" on public.businesses for all using (auth.role() = 'authenticated');
create policy "Admin All Agents" on public.agents for all using (auth.role() = 'authenticated');
create policy "Admin All Tasks" on public.agent_tasks for all using (auth.role() = 'authenticated');
create policy "Admin All Logs" on public.agent_logs for all using (auth.role() = 'authenticated');
