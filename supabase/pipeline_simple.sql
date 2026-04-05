-- ============================================================================
-- SIMPLIFIED PIPELINE SCHEMA
-- No agents, no queues, no orchestration
-- Just: raw scrape → clean → supabase
-- ============================================================================

-- ============================================================================
-- TABLE: Pipeline Progress (Simple Tracking)
-- Tracks which governorate/category is currently being processed
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pipeline_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Current position
    current_governorate text,
    current_category text,
    
    -- Overall status
    status text DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'paused', 'completed')),
    
    -- Counters
    total_governorates integer DEFAULT 0,
    total_categories integer DEFAULT 0,
    completed_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    
    -- Current task info
    records_found integer DEFAULT 0,
    records_imported integer DEFAULT 0,
    error_message text,
    
    -- Timestamps
    started_at timestamptz,
    completed_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Single row constraint (only one pipeline runs at a time)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_single ON public.pipeline_progress((status <> 'idle')) 
WHERE status <> 'idle';

-- Row Level Security
ALTER TABLE public.pipeline_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pipeline_access" ON public.pipeline_progress;
CREATE POLICY "pipeline_access" ON public.pipeline_progress
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_pipeline_progress_updated_at ON public.pipeline_progress;
CREATE TRIGGER update_pipeline_progress_updated_at 
    BEFORE UPDATE ON public.pipeline_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: Pipeline History (Completed Runs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pipeline_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    governorate text NOT NULL,
    category text NOT NULL,
    status text NOT NULL CHECK (status IN ('completed', 'failed')),
    records_found integer DEFAULT 0,
    records_imported integer DEFAULT 0,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pipeline_history_access" ON public.pipeline_history;
CREATE POLICY "pipeline_history_access" ON public.pipeline_history
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pipeline_history_gov ON public.pipeline_history(governorate);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_cat ON public.pipeline_history(category);

-- ============================================================================
-- FUNCTION: Start Pipeline
-- ============================================================================
CREATE OR REPLACE FUNCTION start_pipeline(
    p_governorates text[],
    p_categories text[]
)
RETURNS uuid AS $$
DECLARE
    v_id uuid;
BEGIN
    -- Clear any existing progress
    DELETE FROM public.pipeline_progress;
    
    -- Insert new progress record
    INSERT INTO public.pipeline_progress (
        current_governorate,
        current_category,
        status,
        total_governorates,
        total_categories,
        started_at
    ) VALUES (
        p_governorates[1],
        p_categories[1],
        'running',
        array_length(p_governorates, 1),
        array_length(p_categories, 1),
        now()
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Update Pipeline Progress
-- ============================================================================
CREATE OR REPLACE FUNCTION update_pipeline_progress(
    p_governorate text,
    p_category text,
    p_records_found integer DEFAULT 0,
    p_records_imported integer DEFAULT 0,
    p_error_message text DEFAULT null
)
RETURNS void AS $$
BEGIN
    UPDATE public.pipeline_progress
    SET 
        current_governorate = p_governorate,
        current_category = p_category,
        records_found = p_records_found,
        records_imported = p_records_imported,
        error_message = p_error_message,
        completed_count = completed_count + CASE WHEN p_records_imported > 0 THEN 1 ELSE 0 END,
        failed_count = failed_count + CASE WHEN p_error_message IS NOT NULL THEN 1 ELSE 0 END
    WHERE status = 'running';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Complete Pipeline Step
-- ============================================================================
CREATE OR REPLACE FUNCTION complete_pipeline_step(
    p_governorate text,
    p_category text,
    p_status text,
    p_records_found integer DEFAULT 0,
    p_records_imported integer DEFAULT 0,
    p_error_message text DEFAULT null
)
RETURNS void AS $$
BEGIN
    -- Add to history
    INSERT INTO public.pipeline_history (
        governorate, category, status, 
        records_found, records_imported, error_message
    ) VALUES (
        p_governorate, p_category, p_status,
        p_records_found, p_records_imported, p_error_message
    );
    
    -- Update progress counters
    UPDATE public.pipeline_progress
    SET 
        completed_count = completed_count + CASE WHEN p_status = 'completed' THEN 1 ELSE 0 END,
        failed_count = failed_count + CASE WHEN p_status = 'failed' THEN 1 ELSE 0 END
    WHERE status = 'running';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Finish Pipeline
-- ============================================================================
CREATE OR REPLACE FUNCTION finish_pipeline()
RETURNS void AS $$
BEGIN
    UPDATE public.pipeline_progress
    SET 
        status = 'completed',
        completed_at = now()
    WHERE status = 'running';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Pause/Resume Pipeline
-- ============================================================================
CREATE OR REPLACE FUNCTION pause_pipeline()
RETURNS void AS $$
BEGIN
    UPDATE public.pipeline_progress
    SET status = 'paused'
    WHERE status = 'running';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION resume_pipeline()
RETURNS void AS $$
BEGIN
    UPDATE public.pipeline_progress
    SET status = 'running'
    WHERE status = 'paused';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Reset Pipeline
-- ============================================================================
CREATE OR REPLACE FUNCTION reset_pipeline()
RETURNS void AS $$
BEGIN
    DELETE FROM public.pipeline_progress;
    DELETE FROM public.pipeline_history WHERE created_at > now() - interval '1 day';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: Current Pipeline Status
-- ============================================================================
CREATE OR REPLACE VIEW current_pipeline_status AS
SELECT 
    status,
    current_governorate,
    current_category,
    total_governorates,
    total_categories,
    completed_count,
    failed_count,
    records_found,
    records_imported,
    ROUND(
        (completed_count::float / NULLIF(total_governorates * total_categories, 0)) * 100, 
        1
    ) as percent_complete,
    started_at,
    error_message
FROM public.pipeline_progress
LIMIT 1;

\echo '✅ Simplified Pipeline Schema Created!'
\echo ''
\echo 'Tables:'
\echo '  - pipeline_progress (single row tracking current run)'
\echo '  - pipeline_history (completed steps)'
\echo ''
\echo 'Functions:'
\echo '  - start_pipeline(governorates[], categories[]) - Initialize'
\echo '  - update_pipeline_progress() - Update current position'
\echo '  - complete_pipeline_step() - Mark step done/failed'
\echo '  - finish_pipeline() - Complete entire run'
\echo '  - pause_pipeline() / resume_pipeline() - Pause controls'
\echo '  - reset_pipeline() - Clear and start fresh'
\echo ''
\echo 'Views:'
\echo '  - current_pipeline_status - Current run overview'
