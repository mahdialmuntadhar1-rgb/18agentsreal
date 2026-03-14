-- Task queue used by 18 worker agents
CREATE TABLE IF NOT EXISTS agent_tasks (
  id BIGSERIAL PRIMARY KEY,
  task_type TEXT NOT NULL,
  category TEXT,
  city TEXT,
  government_rate TEXT,
  status TEXT DEFAULT 'pending',
  assigned_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);

-- Business records consumed by the frontend dashboard grid
CREATE TABLE IF NOT EXISTS businesses (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  government_rate TEXT,
  city TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  description TEXT,
  source_url TEXT,
  verification_status TEXT DEFAULT 'pending',
  created_by_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_business ON businesses(name, city);

-- Concurrency-safe queue claim used by agents
CREATE OR REPLACE FUNCTION claim_next_agent_task(p_agent_name TEXT)
RETURNS SETOF agent_tasks
LANGUAGE plpgsql
AS $$
DECLARE
  v_task_id BIGINT;
BEGIN
  SELECT id
  INTO v_task_id
  FROM agent_tasks
  WHERE status = 'pending'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_task_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE agent_tasks
  SET status = 'processing',
      assigned_agent = p_agent_name
  WHERE id = v_task_id;

  RETURN QUERY
  SELECT *
  FROM agent_tasks
  WHERE id = v_task_id;
END;
$$;

-- Realtime for frontend auto-refresh
ALTER PUBLICATION supabase_realtime ADD TABLE businesses;
