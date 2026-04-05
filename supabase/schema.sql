-- ============================================================================
-- HUMUS PRODUCTION DATABASE SCHEMA - Minimal 2-Table Pipeline
-- 
-- This schema provides a clear separation between raw/staging data and
-- production data for the HUMUS Iraqi Business Directory.
--
-- TABLES:
--   1. businesses_import    - Raw/staging data (service role only)
--   2. businesses           - Production data (public read, service write)
--   3. import_batches       - Track import jobs (optional)
--
-- FLOW:
--   CSV/Scraper → businesses_import → Cleaning → Deduplication → businesses
--                              ↓
--                    (delete after processing)
--
-- ============================================================================

-- Enable required extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- TABLE 1: RAW IMPORT STAGING
-- Purpose: Temporary holding for scraper/CSV data before processing
-- Access: Service role only (backend/scraper)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.businesses_import (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core business info (raw from source)
    business_name text,
    arabic_name text,
    english_name text,
    
    -- Classification
    category text,
    subcategory text,
    
    -- Location hierarchy
    governorate text,
    city text,
    neighborhood text,
    address text,
    
    -- Contact info (raw formats)
    phone_1 text,
    phone_2 text,
    whatsapp text,
    email text,
    website text,
    
    -- Social media
    facebook text,
    instagram text,
    tiktok text,
    telegram text,
    
    -- Additional info
    opening_hours text,
    status text,           -- e.g., 'active', 'closed', 'pending_review'
    source text,           -- 'csv_import', 'gemini', 'web_directory', etc.
    source_url text,
    raw_data jsonb,        -- Original raw data for debugging
    
    -- Import metadata
    import_batch_id uuid,  -- Groups records from same import job
    import_errors text[],  -- Validation errors found during import
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,  -- When moved to production
    
    -- Processing status
    processing_status text DEFAULT 'pending' 
        CHECK (processing_status IN ('pending', 'cleaning', 'deduped', 'published', 'rejected'))
);

-- Indexes for import table (performance during batch operations)
CREATE INDEX IF NOT EXISTS idx_import_status ON public.businesses_import(processing_status);
CREATE INDEX IF NOT EXISTS idx_import_batch ON public.businesses_import(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_import_city ON public.businesses_import(city);
CREATE INDEX IF NOT EXISTS idx_import_category ON public.businesses_import(category);
CREATE INDEX IF NOT EXISTS idx_import_created ON public.businesses_import(created_at DESC);

-- Row Level Security: Service role only, no public access
ALTER TABLE public.businesses_import ENABLE ROW LEVEL SECURITY;

-- Only service role can access import table
DROP POLICY IF EXISTS "service_only_import" ON public.businesses_import;
CREATE POLICY "service_only_import" ON public.businesses_import
    FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.businesses_import IS 
    'Staging table for raw business imports. Data here is not yet cleaned or deduplicated.';


-- ============================================================================
-- TABLE 2: PRODUCTION BUSINESSES (Single Source of Truth)
-- Purpose: Live data for the frontend
-- Access: Public read (via RLS), Service role write
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core business info (cleaned)
    business_name text NOT NULL,
    arabic_name text,
    english_name text,
    
    -- Classification (normalized)
    category text NOT NULL,
    subcategory text,
    
    -- Location (normalized to standard names)
    governorate text NOT NULL,
    city text NOT NULL,
    neighborhood text,
    address text,
    
    -- Contact (cleaned formats)
    phone_1 text,
    phone_2 text,
    whatsapp text,
    email text,
    website text,
    
    -- Social media (normalized URLs)
    facebook text,
    instagram text,
    tiktok text,
    telegram text,
    
    -- Business details
    opening_hours text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
    verification_status text DEFAULT 'unverified' 
        CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    
    -- Data quality tracking
    confidence_score float DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    source text NOT NULL,  -- 'csv_import', 'gemini', 'web_directory', 'manual'
    source_url text,
    
    -- Import tracking
    import_batch_id uuid,
    original_import_id uuid REFERENCES public.businesses_import(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz,  -- When first made live
    last_synced_at timestamptz  -- Last time data was refreshed from source
);

-- Indexes for production table
CREATE INDEX IF NOT EXISTS idx_businesses_city ON public.businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_governorate ON public.businesses(governorate);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_verification ON public.businesses(verification_status);
CREATE INDEX IF NOT EXISTS idx_businesses_created ON public.businesses(created_at DESC);

-- Full-text search (for future search feature)
CREATE INDEX IF NOT EXISTS idx_businesses_name_trgm ON public.businesses USING gin (business_name gin_trgm_ops);

-- Deduplication: Prevent duplicates based on name + location + contact
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_dedupe 
    ON public.businesses (
        LOWER(business_name), 
        LOWER(city), 
        COALESCE(LOWER(phone_1), ''),
        COALESCE(LOWER(website), '')
    )
    WHERE status = 'active';  -- Only dedupe active businesses

-- Row Level Security for production table
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Public can READ active businesses (for the frontend)
DROP POLICY IF EXISTS "public_read_active_businesses" ON public.businesses;
CREATE POLICY "public_read_active_businesses" ON public.businesses
    FOR SELECT TO anon, authenticated
    USING (status = 'active');

-- Service role has full access
DROP POLICY IF EXISTS "service_role_full_access" ON public.businesses;
CREATE POLICY "service_role_full_access" ON public.businesses
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
CREATE TRIGGER update_businesses_updated_at 
    BEFORE UPDATE ON public.businesses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.businesses IS 
    'Production table for live business directory. Single source of truth for the frontend.';


-- ============================================================================
-- TABLE 3: Import Batch Tracking (optional but recommended)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.import_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source text NOT NULL,           -- 'csv', 'gemini', 'web_directory', etc.
    filename text,                  -- For CSV imports
    records_count integer DEFAULT 0,
    processed_count integer DEFAULT 0,
    error_count integer DEFAULT 0,
    status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    error_message text,
    metadata jsonb                  -- Additional info about the import
);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_only_batches" ON public.import_batches;
CREATE POLICY "service_only_batches" ON public.import_batches
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add foreign key references
ALTER TABLE public.businesses_import 
    DROP CONSTRAINT IF EXISTS fk_import_batch,
    ADD CONSTRAINT fk_import_batch 
    FOREIGN KEY (import_batch_id) REFERENCES public.import_batches(id) ON DELETE SET NULL;
    
ALTER TABLE public.businesses 
    DROP CONSTRAINT IF EXISTS fk_business_batch,
    ADD CONSTRAINT fk_business_batch 
    FOREIGN KEY (import_batch_id) REFERENCES public.import_batches(id) ON DELETE SET NULL;


-- ============================================================================
-- VIEWS FOR OPERATOR CONVENIENCE
-- ============================================================================

-- View: Import pipeline status
CREATE OR REPLACE VIEW import_pipeline_status AS
SELECT 
    processing_status,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public.businesses_import
GROUP BY processing_status;

-- View: Recent production businesses
CREATE OR REPLACE VIEW recent_businesses AS
SELECT 
    id,
    business_name,
    city,
    governorate,
    category,
    status,
    confidence_score,
    created_at
FROM public.businesses
ORDER BY created_at DESC
LIMIT 100;

-- View: Data quality summary
CREATE OR REPLACE VIEW data_quality_summary AS
SELECT 
    category,
    COUNT(*) as total_businesses,
    COUNT(phone_1) as with_phone,
    COUNT(website) as with_website,
    AVG(confidence_score) as avg_confidence
FROM public.businesses
WHERE status = 'active'
GROUP BY category;

-- ============================================================================
-- VERIFICATION QUERIES (run after setup)
-- ============================================================================

-- Check table counts
SELECT 'businesses_import' as table_name, COUNT(*) as count FROM public.businesses_import
UNION ALL
SELECT 'businesses' as table_name, COUNT(*) as count FROM public.businesses
UNION ALL
SELECT 'import_batches' as table_name, COUNT(*) as count FROM public.import_batches;

\echo '✅ HUMUS Database Schema Created Successfully!'
\echo ''
\echo 'Tables created:'
\echo '  - businesses_import (staging/raw data)'
\echo '  - businesses (production/live data)'
\echo '  - import_batches (batch tracking)'
\echo ''
\echo 'Views created:'
\echo '  - import_pipeline_status (monitor imports)'
\echo '  - recent_businesses (latest additions)'
\echo '  - data_quality_summary (quality metrics)'
\echo ''
\echo 'NEXT STEPS:'
\echo '  1. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env'
\echo '  2. Test connection from frontend'
\echo '  3. Import data to businesses_import table'
\echo '  4. Run cleaning pipeline to promote to businesses table'
