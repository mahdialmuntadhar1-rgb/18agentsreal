CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE raw_businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  phone_numbers TEXT[] DEFAULT '{}',
  social_media_urls TEXT[] DEFAULT '{}',
  google_maps_url TEXT,
  address_ar TEXT,
  address_en TEXT,
  category TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  source TEXT NOT NULL CHECK (source IN ('google_places', 'gemini_extraction', 'fallback_scraper')),
  agent_job_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE verified_businesses (
  LIKE raw_businesses INCLUDING ALL,
  verification_score INTEGER NOT NULL CHECK (verification_score >= 0 AND verification_score <= 100),
  status TEXT NOT NULL CHECK (status IN ('approved', 'needs_review', 'rejected')),
  verified_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE agent_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  records_found INTEGER DEFAULT 0,
  records_verified INTEGER DEFAULT 0,
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES agent_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_raw_city ON raw_businesses(city);
CREATE INDEX idx_raw_job ON raw_businesses(agent_job_id);
CREATE INDEX idx_verified_status ON verified_businesses(status);
CREATE INDEX idx_jobs_status ON agent_jobs(status);
CREATE INDEX idx_logs_job ON agent_logs(job_id);

ALTER TABLE verified_businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to verified businesses" ON verified_businesses FOR SELECT USING (true);
