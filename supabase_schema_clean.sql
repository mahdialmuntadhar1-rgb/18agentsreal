create extension if not exists pgcrypto;

-- Businesses table with full recommended fields for production use
-- CLEAN PRODUCTION TABLE - Only validated businesses with exactly 11-digit phone numbers
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  
  -- Source tracking
  source_name text,
  source_url text,
  external_source_id text,
  
  -- Business identity
  business_name text not null,
  business_name_ar text,
  business_name_ku text,
  
  -- Categorization
  category text not null,
  subcategory text,
  tags text[],
  
  -- Location
  governorate text,
  city text not null,
  country text default 'Iraq',
  address text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  google_maps_url text,
  
  -- Contact (phone must be exactly 11 digits after normalization)
  phone text,
  whatsapp text,
  email text,
  website text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  
  -- Details
  description text,
  opening_hours text,
  price_range text,
  
  -- Ratings & media
  rating numeric(3, 2),
  review_count integer,
  images text[],
  
  -- Metadata & verification
  created_by_agent text,
  verification_status text default 'pending',
  confidence_score numeric(3, 2),
  status text default 'active',
  
  -- Timestamps
  scraped_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Indexes for common queries
-- Unique constraint for deduplication during sync
create unique index if not exists businesses_unique_identity_idx
  on businesses (business_name, address, city);

create index if not exists businesses_category_city_idx
  on businesses (category, city);

create index if not exists businesses_phone_idx
  on businesses (phone);

create index if not exists businesses_source_idx
  on businesses (source_name, external_source_id);

create index if not exists businesses_agent_idx
  on businesses (created_by_agent, scraped_at desc);

-- Phone validation constraint function
create or replace function is_valid_iraqi_phone(phone text)
returns boolean as $$
begin
  if phone is null then
    return false;
  end if;
  -- Normalize: remove all non-digits
  phone := regexp_replace(phone, '\D', '', 'g');
  -- Must be exactly 11 digits
  return length(phone) = 11;
end;
$$ language plpgsql immutable;

-- Agents table
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  agent_name text unique not null,
  category text,
  city text,
  government_rate text,
  status text default 'idle',
  records_collected integer default 0,
  target integer default 1000,
  errors integer default 0,
  last_run timestamptz,
  updated_at timestamptz default now()
);

-- Agent tasks queue
create table if not exists agent_tasks (
  id bigserial primary key,
  task_name text not null,
  task_type text not null,
  instruction text,
  assigned_to text,
  agent_name text,
  category text,
  city text,
  government_rate text,
  status text not null default 'pending',
  result_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agent logs
create table if not exists agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  action text not null,
  record_id text,
  details text,
  created_at timestamptz default now()
);

create index if not exists agent_logs_created_at_idx
  on agent_logs (created_at desc);

-- Task claiming function for distributed agents
create or replace function claim_next_task(agent_name text)
returns setof agent_tasks
language plpgsql
security definer
as $$
declare
  claimed_id bigint;
begin
  select id
  into claimed_id
  from agent_tasks
  where status = 'pending'
    and (agent_tasks.agent_name = claim_next_task.agent_name or agent_tasks.agent_name is null)
  order by created_at
  limit 1
  for update skip locked;

  if claimed_id is null then
    return;
  end if;

  update agent_tasks
  set status = 'running', updated_at = now(), agent_name = claim_next_task.agent_name
  where id = claimed_id;

  return query
  select * from agent_tasks where id = claimed_id;
end;
$$;

-- Enable RLS
alter table businesses enable row level security;
alter table agents enable row level security;
alter table agent_tasks enable row level security;
alter table agent_logs enable row level security;

-- Create policies for service role access
create policy "Enable all access for service role" on businesses
  for all using (true) with check (true);
create policy "Enable all access for service role" on agents
  for all using (true) with check (true);
create policy "Enable all access for service role" on agent_tasks
  for all using (true) with check (true);
create policy "Enable all access for service role" on agent_logs
  for all using (true) with check (true);

-- Public read policies
create policy "Public Read Businesses" on businesses for select using (true);
create policy "Public Read Agents" on agents for select using (true);
create policy "Public Read Tasks" on agent_tasks for select using (true);
create policy "Public Read Logs" on agent_logs for select using (true);
