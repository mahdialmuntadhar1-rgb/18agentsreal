-- Unified Businesses Table
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name JSONB NOT NULL, -- { "en": "...", "ar": "...", "ku": "..." }
  description JSONB, -- { "en": "...", "ar": "...", "ku": "..." }
  category TEXT NOT NULL,
  whatsapp TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  governorate TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 0.0,
  is_verified BOOLEAN DEFAULT FALSE,
  needs_review BOOLEAN DEFAULT FALSE,
  scraped_photo_url TEXT,
  ai_processed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Logs Table
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL, -- e.g., 'baghdad_agent', 'qc_overseer'
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')),
  governorate TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Haversine Formula Function for Geofencing
CREATE OR REPLACE FUNCTION get_nearby_businesses(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10.0
)
RETURNS SETOF businesses AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM businesses
  WHERE (
    6371 * acos(
      cos(radians(lat)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(lng)) +
      sin(radians(lat)) * sin(radians(latitude))
    )
  ) <= radius_km;
END;
$$ LANGUAGE plpgsql;

-- Real-time Replication (Enable for businesses and agent_logs)
ALTER PUBLICATION supabase_realtime ADD TABLE businesses;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;
