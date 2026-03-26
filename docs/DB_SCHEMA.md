# DB Schema Contract

Core tables:

- `agents`: status and connector metadata.
- `agent_tasks`: durable queue rows.
- `agent_runs`: bounded invocation tracking.
- `agent_logs`: structured correlated logs.
- `businesses`: idempotent ingest target (`source_hash` unique).
- `governorates`: stable region routing/filtering support.

RPC function:

- `claim_next_task(p_agent_id text, p_max_attempts integer)` uses `FOR UPDATE SKIP LOCKED` and atomically flips task state to `processing`.

RLS model:

- RLS enabled for all runtime tables.
- Service-role policies allow worker full access.
- UI-facing policies should be added separately for `anon`/`authenticated` based on product visibility rules.

## Launch contract checklist

Before launch, validate these contracts in Supabase:

- `businesses.source_hash` is `NOT NULL` and uniquely indexed (`uq_businesses_source_hash`) to prevent duplicate ingest.
- `agent_tasks.idempotency_key` is unique and `claim_next_task` is deployed exactly as defined in migrations.
- Realtime publication includes `businesses` (`alter publication supabase_realtime add table businesses;`).
- Every runtime table (`governorates`, `agents`, `agent_tasks`, `agent_runs`, `agent_logs`, `businesses`) has RLS enabled and explicit service-role policies.
- All app environments apply `supabase/migrations/0001_agent_runtime.sql` plus `supabase/migrations/0002_v4_schema_patch.sql` without drift.
