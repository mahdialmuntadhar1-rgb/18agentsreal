-- ============================================================
-- Iraq Compass — Complete Supabase Schema
-- Target: https://hsadukhmcclwixuntqwu.supabase.co
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ⚠️  This is a FULL migration. Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0.1 Drop existing tables so we can recreate with correct columns
--     ⚠️ This DELETES all existing data. Remove this section if you want to keep data.
DROP TABLE IF EXISTS agent_logs CASCADE;
DROP TABLE IF EXISTS agent_tasks CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS verified_businesses CASCADE;
DROP TABLE IF EXISTS raw_businesses CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- ============================================================
-- 1. BUSINESSES  (main table — used by FinderAgent, SocialScraper,
--    BaseGovernor, Home.tsx, Admin.tsx, AgentCommander import)
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id     TEXT UNIQUE NOT NULL,               -- slug e.g. "ali-restaurant-sulaymaniyah"
  name            JSONB NOT NULL DEFAULT '{}',        -- { "en": "", "ar": "", "ku": "" }
  category        TEXT NOT NULL,
  subcategory     TEXT,
  governorate     TEXT,
  city            TEXT NOT NULL,
  district        TEXT,
  latitude        FLOAT8,
  longitude       FLOAT8,
  city_center_only BOOLEAN DEFAULT false,

  -- Verification
  verified              BOOLEAN DEFAULT false,
  verification_score    INTEGER DEFAULT 0,
  verification_status   TEXT DEFAULT 'pending',       -- pending, verified, flagged, rejected

  -- Source tracking
  sources         TEXT[] DEFAULT '{}',

  -- Rich contact (JSONB — FinderAgent / SocialScraper path)
  contact         JSONB DEFAULT '{"phone":[],"whatsapp":"","website":"","instagram":"","facebook":""}',
  location        JSONB DEFAULT '{"google_maps_url":"","coordinates":{"lat":null,"lng":null},"address":{"en":"","ar":"","ku":""}}',
  postcard        JSONB DEFAULT '{"logo_url":"","cover_image_url":"","tagline":{"en":"","ar":"","ku":""},"description":{"en":"","ar":"","ku":""},"highlights":[]}',

  -- Flat fields (BaseGovernor / Google Places path)
  phone           TEXT,
  website         TEXT,
  address         TEXT,
  description     TEXT,
  source_url      TEXT,
  government_rate TEXT,
  created_by_agent TEXT,

  -- Metadata
  agent_notes     TEXT,
  last_verified   TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. RAW_BUSINESSES  (DataCleaner upload staging)
-- ============================================================
CREATE TABLE IF NOT EXISTS raw_businesses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_raw        TEXT,
  category_raw    TEXT,
  governorate     TEXT,
  city            TEXT,
  address         TEXT,
  phone           TEXT,
  source          TEXT,
  coordinates     JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. VERIFIED_BUSINESSES  (Approval / Review pipeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS verified_businesses (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_id            UUID REFERENCES raw_businesses(id),
  name_ar           TEXT,
  name_ku           TEXT,
  name_en           TEXT,
  category          TEXT,
  governorate       TEXT,
  city              TEXT,
  address           TEXT,
  phone             TEXT,
  website           TEXT,
  coordinates       JSONB,
  photos            TEXT[] DEFAULT '{}',
  verification_score INTEGER DEFAULT 0,
  confidence_score  INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'pending',           -- pending, approved, rejected, flagged
  approved_by       TEXT,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. AGENTS  (status tracking for 18 governors + QC)
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name        TEXT UNIQUE NOT NULL,
  category          TEXT,
  government_rate   TEXT,
  status            TEXT DEFAULT 'idle',              -- idle, active, error
  records_collected INTEGER DEFAULT 0,
  target            INTEGER DEFAULT 1000,
  errors            INTEGER DEFAULT 0,
  last_run          TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. AGENT_TASKS  (work queue)
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id        TEXT,                               -- "Agent-01" style ID
  agent_name      TEXT,
  task_type       TEXT NOT NULL DEFAULT 'chat',       -- chat, find, social, clean, verify, scrape
  prompt          TEXT,
  status          TEXT DEFAULT 'pending',             -- pending, processing, completed, failed
  result          TEXT,
  category        TEXT,
  city            TEXT,
  government_rate TEXT,
  description     TEXT,
  assigned_agent  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. AGENT_LOGS  (activity tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name      TEXT NOT NULL,
  action          TEXT NOT NULL,
  details         TEXT,
  record_id       TEXT,
  records_added   INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  result          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_businesses_city          ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_governorate   ON businesses(governorate);
CREATE INDEX IF NOT EXISTS idx_businesses_category      ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_verified      ON businesses(verified);
CREATE INDEX IF NOT EXISTS idx_businesses_city_center   ON businesses(city_center_only);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status       ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent        ON agent_tasks(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent         ON agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created       ON agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verified_biz_status      ON verified_businesses(status);
CREATE INDEX IF NOT EXISTS idx_raw_biz_governorate      ON raw_businesses(governorate);

-- ============================================================
-- 8. CITY-CENTER DIRECTORY VIEW + INITIAL GEOCODING RULES
-- ============================================================
CREATE OR REPLACE VIEW live_directory AS
SELECT *
FROM businesses
WHERE verification_status = 'verified'
  AND city_center_only = true;

-- Optional one-time city-center tagging pass.
-- The ±0.08/±0.08 box is intentionally conservative for downtown-only filtering.
WITH governorate_centers(governorate, city_label, center_lat, center_lng) AS (
  VALUES
    ('Sulaymaniyah', 'Sulaymaniyah City', 35.5577, 45.4351),
    ('Baghdad', 'Baghdad City', 33.3152, 44.3661),
    ('Erbil', 'Erbil City', 36.1911, 44.0090),
    ('Basra', 'Basra City', 30.5085, 47.7804),
    ('Duhok', 'Duhok City', 36.8673, 42.9815),
    ('Najaf', 'Najaf City', 31.9960, 44.3176),
    ('Karbala', 'Karbala City', 32.6159, 44.0241),
    ('Kirkuk', 'Kirkuk City', 35.4681, 44.3922),
    ('Mosul', 'Mosul City', 36.3350, 43.1189),
    ('Anbar', 'Ramadi City', 33.4358, 43.2996),
    ('Diyala', 'Baquba City', 33.7450, 44.6386),
    ('Wasit', 'Kut City', 32.5006, 45.8231),
    ('Babil', 'Hillah City', 32.4769, 44.4321),
    ('Muthanna', 'Samawah City', 31.3161, 45.2844),
    ('Dhi Qar', 'Nasiriyah City', 31.0448, 46.2537),
    ('Maysan', 'Amarah City', 31.8358, 47.1463),
    ('Qadisiyyah', 'Diwaniyah City', 31.9888, 44.9291),
    ('Saladin', 'Tikrit City', 34.6057, 43.6781)
)
UPDATE businesses b
SET city_center_only = true,
    city = c.city_label
FROM governorate_centers c
WHERE b.governorate ILIKE '%' || c.governorate || '%'
  AND b.latitude IS NOT NULL
  AND b.longitude IS NOT NULL
  AND b.latitude BETWEEN (c.center_lat - 0.08) AND (c.center_lat + 0.08)
  AND b.longitude BETWEEN (c.center_lng - 0.08) AND (c.center_lng + 0.08);

-- Example explicit suburb exclusion for Sulaymaniyah.
UPDATE businesses
SET city_center_only = false
WHERE governorate ILIKE '%Sulaymaniyah%'
  AND (
    city ILIKE '%Chamchamal%' OR
    city ILIKE '%Dokan%' OR
    city ILIKE '%Rania%' OR
    city ILIKE '%Halabja%' OR
    city ILIKE '%Penjwin%' OR
    city ILIKE '%Said Sadiq%'
  );

-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE businesses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_businesses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs          ENABLE ROW LEVEL SECURITY;

-- Public read policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Businesses') THEN
    CREATE POLICY "Public Read Businesses"   ON businesses          FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Raw') THEN
    CREATE POLICY "Public Read Raw"          ON raw_businesses      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Verified') THEN
    CREATE POLICY "Public Read Verified"     ON verified_businesses FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Agents') THEN
    CREATE POLICY "Public Read Agents"       ON agents              FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Tasks') THEN
    CREATE POLICY "Public Read Tasks"        ON agent_tasks         FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Logs') THEN
    CREATE POLICY "Public Read Logs"         ON agent_logs          FOR SELECT USING (true);
  END IF;
END $$;

-- Public write policies (tighten for production — use service_role key on server)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon Insert Businesses') THEN
    CREATE POLICY "Anon Insert Businesses"  ON businesses          FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon Update Businesses') THEN
    CREATE POLICY "Anon Update Businesses"  ON businesses          FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon Delete Businesses') THEN
    CREATE POLICY "Anon Delete Businesses"  ON businesses          FOR DELETE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon Write Raw') THEN
    CREATE POLICY "Anon Write Raw"          ON raw_businesses      FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon Write Verified') THEN
    CREATE POLICY "Anon Write Verified"     ON verified_businesses FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon Update Verified') THEN
    CREATE POLICY "Anon Update Verified"    ON verified_businesses FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon Insert Agents') THEN
    CREATE POLICY "Anon Insert Agents"      ON agents              FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon Update Agents') THEN
    CREATE POLICY "Anon Update Agents"      ON agents              FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon Insert Tasks') THEN
    CREATE POLICY "Anon Insert Tasks"       ON agent_tasks         FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon Update Tasks') THEN
    CREATE POLICY "Anon Update Tasks"       ON agent_tasks         FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon Delete Tasks') THEN
    CREATE POLICY "Anon Delete Tasks"       ON agent_tasks         FOR DELETE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon Insert Logs') THEN
    CREATE POLICY "Anon Insert Logs"        ON agent_logs          FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 10. RPC: claim_next_task  (concurrency-safe task queue)
--    Used by BaseGovernor for FOR UPDATE SKIP LOCKED pattern
-- ============================================================
CREATE OR REPLACE FUNCTION claim_next_task(p_agent_name TEXT)
RETURNS SETOF agent_tasks AS $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id
  FROM agent_tasks
  WHERE status = 'pending'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF target_id IS NOT NULL THEN
    RETURN QUERY
    UPDATE agent_tasks
    SET status = 'processing',
        assigned_agent = p_agent_name,
        updated_at = now()
    WHERE id = target_id
    RETURNING *;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 11. SEED: 18 Governors + QC Overseer
-- ============================================================
INSERT INTO agents (agent_name, category, status, target)
VALUES
  ('Agent-01', 'restaurants',      'idle', 1000),
  ('Agent-02', 'cafes',            'idle', 1000),
  ('Agent-03', 'bakeries',         'idle', 1000),
  ('Agent-04', 'hotels',           'idle', 1000),
  ('Agent-05', 'gyms',             'idle', 1000),
  ('Agent-06', 'beauty_salons',    'idle', 1000),
  ('Agent-07', 'barbershops',      'idle', 1000),
  ('Agent-08', 'pharmacies',       'idle', 1000),
  ('Agent-09', 'supermarkets',     'idle', 1000),
  ('Agent-10', 'electronics',      'idle', 1000),
  ('Agent-11', 'clothing_stores',  'idle', 1000),
  ('Agent-12', 'car_services',     'idle', 1000),
  ('Agent-13', 'dentists',         'idle', 1000),
  ('Agent-14', 'clinics',          'idle', 1000),
  ('Agent-15', 'schools',          'idle', 1000),
  ('Agent-16', 'coworking',        'idle', 1000),
  ('Agent-17', 'entertainment',    'idle', 1000),
  ('Agent-18', 'tourism',          'idle', 1000),
  ('QC Overseer', 'Quality Control', 'idle', 0),
  ('Finder Agent', 'Business Lead Discovery', 'idle', 0),
  ('Social Scraper', 'Instagram & Facebook Discovery', 'idle', 0)
ON CONFLICT (agent_name) DO NOTHING;

-- ============================================================
-- 11. Enable Realtime (for frontend subscriptions)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE businesses;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;
