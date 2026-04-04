-- Clean Supabase Schema for 18 Agents Real
-- Run this in Supabase SQL Editor

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Jobs Table (Track agent execution)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'running', -- running, completed, failed
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  records_found INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Job Logs Table (Track execution details)
CREATE TABLE IF NOT EXISTS job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'INFO', -- INFO, WARN, ERROR
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Staging Records Table (Raw data from agents)
CREATE TABLE IF NOT EXISTS staging_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  governorate TEXT,
  address TEXT,
  phone_1 TEXT,
  phone_2 TEXT,
  website TEXT,
  email TEXT,
  source TEXT,
  source_url TEXT,
  status TEXT DEFAULT 'pending_review', -- pending_review, approved, rejected
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Businesses Table (Final approved records)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  governorate TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  email TEXT,
  source TEXT,
  confidence_score NUMERIC(3, 2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
CREATE INDEX IF NOT EXISTS jobs_agent_name_idx ON jobs(agent_name);
CREATE INDEX IF NOT EXISTS job_logs_job_id_idx ON job_logs(job_id);
CREATE INDEX IF NOT EXISTS staging_records_city_idx ON staging_records(city);
CREATE INDEX IF NOT EXISTS staging_records_category_idx ON staging_records(category);
CREATE INDEX IF NOT EXISTS businesses_category_city_idx ON businesses(category, city);

-- Enable Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staging_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (backend) access
CREATE POLICY "Enable all access for service role" ON jobs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON job_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON staging_records
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON businesses
  FOR ALL USING (true) WITH CHECK (true);
