-- SQL Schema for Iraq Compass (Supabase)
-- Run this in your Supabase SQL Editor

-- 1. Businesses Table (High-Fidelity)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id TEXT UNIQUE NOT NULL, -- unique-slug
  name JSONB NOT NULL, -- { "en": "", "ar": "", "ku": "" }
  category TEXT NOT NULL,
  subcategory TEXT,
  city TEXT NOT NULL,
  district TEXT,
  verified BOOLEAN DEFAULT false,
  verification_score INTEGER DEFAULT 0,
  sources TEXT[] DEFAULT '{}',
  contact JSONB DEFAULT '{ "phone": [], "whatsapp": "", "website": "", "instagram": "", "facebook": "" }',
  location JSONB DEFAULT '{ "google_maps_url": "", "coordinates": { "lat": null, "lng": null }, "address": { "en": "", "ar": "", "ku": "" } }',
  postcard JSONB DEFAULT '{ "logo_url": "", "cover_image_url": "", "tagline": { "en": "", "ar": "", "ku": "" }, "description": { "en": "", "ar": "", "ku": "" }, "highlights": [] }',
  agent_notes TEXT,
  last_verified TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Agents Table (Status Tracking)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT UNIQUE NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'idle', -- idle, active, error
  records_collected INTEGER DEFAULT 0,
  target INTEGER DEFAULT 1000,
  errors INTEGER DEFAULT 0,
  last_run TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- 4. Public Read Policies
CREATE POLICY "Public Read Businesses" ON businesses FOR SELECT USING (true);
CREATE POLICY "Public Read Agents" ON agents FOR SELECT USING (true);

-- 5. Admin Write Policies (Replace with your auth logic)
CREATE POLICY "Admin All Businesses" ON businesses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Agents" ON agents FOR ALL USING (auth.role() = 'authenticated');
