-- ============================================================================
-- SCRAPER QUEUE SYSTEM SCHEMA
-- Adds tables for sequential task queueing and reset functionality
-- ============================================================================

-- ============================================================================
-- TABLE: Scraper Task Queue
-- Individual tasks that need to be executed sequentially
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scraper_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Task identification
    governorate text NOT NULL,
    category text NOT NULL,
    task_name text GENERATED ALWAYS AS (governorate || ' + ' || category) STORED,
    
    -- Queue status
    status text DEFAULT 'pending' 
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    
    -- Execution tracking
    started_at timestamptz,
    completed_at timestamptz,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    
    -- Results
    records_found integer DEFAULT 0,
    records_imported integer DEFAULT 0,
    error_message text,
    logs text[],  -- Array of log messages
    
    -- Queue ordering
    queue_position integer,
    
    -- Batch grouping
    batch_id uuid REFERENCES public.import_batches(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for task queue
CREATE INDEX IF NOT EXISTS idx_scraper_tasks_status ON public.scraper_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scraper_tasks_position ON public.scraper_tasks(queue_position);
CREATE INDEX IF NOT EXISTS idx_scraper_tasks_batch ON public.scraper_tasks(batch_id);
CREATE INDEX IF NOT EXISTS idx_scraper_tasks_created ON public.scraper_tasks(created_at DESC);

-- Row Level Security
ALTER TABLE public.scraper_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_scraper_tasks" ON public.scraper_tasks;
CREATE POLICY "service_scraper_tasks" ON public.scraper_tasks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS update_scraper_tasks_updated_at ON public.scraper_tasks;
CREATE TRIGGER update_scraper_tasks_updated_at 
    BEFORE UPDATE ON public.scraper_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.scraper_tasks IS 
    'Queue of scraper tasks to execute sequentially. One task per governorate+category combination.';

-- ============================================================================
-- VIEW: Scraper Queue Status (for UI)
-- ============================================================================
CREATE OR REPLACE VIEW scraper_queue_status AS
SELECT 
    status,
    COUNT(*) as task_count,
    MIN(queue_position) as min_position,
    MAX(queue_position) as max_position
FROM public.scraper_tasks
GROUP BY status;

-- ============================================================================
-- VIEW: Current Queue Progress
-- ============================================================================
CREATE OR REPLACE VIEW scraper_queue_progress AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'running') as running_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
    COUNT(*) as total_count
FROM public.scraper_tasks;

-- ============================================================================
-- FUNCTION: Get Next Pending Task
-- Returns the next task that should be executed
-- ============================================================================
CREATE OR REPLACE FUNCTION get_next_scraper_task()
RETURNS TABLE (
    task_id uuid,
    task_governorate text,
    task_category text,
    task_position integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.governorate,
        t.category,
        t.queue_position
    FROM public.scraper_tasks t
    WHERE t.status = 'pending'
    ORDER BY t.queue_position ASC, t.created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Reset Scraper Data (Safe)
-- Clears staging/scraper tables but preserves production businesses
-- ============================================================================
CREATE OR REPLACE FUNCTION reset_scraper_data(
    p_delete_staging boolean DEFAULT true,
    p_delete_queue boolean DEFAULT true,
    p_delete_batches boolean DEFAULT true
)
RETURNS TABLE (
    table_name text,
    records_deleted integer
) AS $$
DECLARE
    v_count integer;
BEGIN
    -- Delete from staging table (businesses_import)
    IF p_delete_staging THEN
        SELECT COUNT(*) INTO v_count FROM public.businesses_import 
        WHERE processing_status IN ('pending', 'cleaning', 'deduped');
        
        DELETE FROM public.businesses_import 
        WHERE processing_status IN ('pending', 'cleaning', 'deduped');
        
        RETURN QUERY SELECT 'businesses_import (staging)'::text, v_count;
    END IF;
    
    -- Delete from queue
    IF p_delete_queue THEN
        SELECT COUNT(*) INTO v_count FROM public.scraper_tasks;
        
        DELETE FROM public.scraper_tasks;
        
        RETURN QUERY SELECT 'scraper_tasks (queue)'::text, v_count;
    END IF;
    
    -- Delete from batches
    IF p_delete_batches THEN
        SELECT COUNT(*) INTO v_count FROM public.import_batches 
        WHERE status IN ('running', 'failed');
        
        DELETE FROM public.import_batches 
        WHERE status IN ('running', 'failed');
        
        RETURN QUERY SELECT 'import_batches (incomplete)'::text, v_count;
    END IF;
    
    -- Note: production businesses table is NOT touched
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Create Scraper Task Queue
-- Generates sequential tasks for selected governorates and categories
-- ============================================================================
CREATE OR REPLACE FUNCTION create_scraper_queue(
    p_governorates text[],
    p_categories text[]
)
RETURNS TABLE (
    task_id uuid,
    governorate text,
    category text,
    queue_position integer
) AS $$
DECLARE
    v_governorate text;
    v_category text;
    v_position integer := 1;
    v_task_id uuid;
BEGIN
    -- Create a batch for this queue
    INSERT INTO public.import_batches (source, status, metadata)
    VALUES ('scraper_queue', 'running', jsonb_build_object(
        'governorates', p_governorates,
        'categories', p_categories,
        'total_tasks', array_length(p_governorates, 1) * array_length(p_categories, 1)
    ))
    RETURNING id INTO v_task_id;
    
    -- Create tasks for each combination
    FOREACH v_governorate IN ARRAY p_governorates
    LOOP
        FOREACH v_category IN ARRAY p_categories
        LOOP
            INSERT INTO public.scraper_tasks (
                governorate, 
                category, 
                queue_position,
                status,
                batch_id
            )
            VALUES (
                v_governorate, 
                v_category, 
                v_position,
                'pending',
                v_task_id
            )
            RETURNING scraper_tasks.id INTO v_task_id;
            
            RETURN QUERY SELECT v_task_id, v_governorate, v_category, v_position;
            v_position := v_position + 1;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Mark Task Complete/Failed
-- ============================================================================
CREATE OR REPLACE FUNCTION update_scraper_task_status(
    p_task_id uuid,
    p_status text,
    p_records_found integer DEFAULT 0,
    p_records_imported integer DEFAULT 0,
    p_error_message text DEFAULT null,
    p_log_message text DEFAULT null
)
RETURNS void AS $$
BEGIN
    UPDATE public.scraper_tasks
    SET 
        status = p_status,
        completed_at = CASE WHEN p_status IN ('completed', 'failed', 'cancelled') THEN now() ELSE completed_at END,
        records_found = CASE WHEN p_status = 'completed' THEN p_records_found ELSE records_found END,
        records_imported = CASE WHEN p_status = 'completed' THEN p_records_imported ELSE records_imported END,
        error_message = CASE WHEN p_status = 'failed' THEN p_error_message ELSE error_message END,
        logs = CASE WHEN p_log_message IS NOT NULL THEN array_append(COALESCE(logs, '{}'), p_log_message) ELSE logs END,
        retry_count = CASE WHEN p_status = 'failed' THEN retry_count + 1 ELSE retry_count END
    WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Retry Failed Tasks
-- ============================================================================
CREATE OR REPLACE FUNCTION retry_failed_scraper_tasks()
RETURNS integer AS $$
DECLARE
    v_count integer;
BEGIN
    UPDATE public.scraper_tasks
    SET 
        status = 'pending',
        error_message = null,
        retry_count = retry_count + 1
    WHERE status = 'failed' 
    AND retry_count < max_retries;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

\echo '✅ Scraper Queue System Created Successfully!'
\echo ''
\echo 'New tables:'
\echo '  - scraper_tasks (sequential task queue)'
\echo ''
\echo 'New functions:'
\echo '  - create_scraper_queue(governorates[], categories[]) - Create task queue'
\echo '  - get_next_scraper_task() - Get next pending task'
\echo '  - update_scraper_task_status() - Mark task complete/failed'
\echo '  - reset_scraper_data() - Clear staging/queue data (safe)'
\echo '  - retry_failed_scraper_tasks() - Retry failed tasks'
\echo ''
\echo 'New views:'
\echo '  - scraper_queue_status - Overview of queue by status'
\echo '  - scraper_queue_progress - Progress counts'
