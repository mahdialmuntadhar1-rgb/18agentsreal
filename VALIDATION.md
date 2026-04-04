# Validation / Proof of Execution Runbook

## 1. Apply schema
- In Supabase SQL editor run:
  - `migrations/20260404_runtime_hardening.sql`

## 2. Configure environment
1. Copy `.env.example` to `.env`.
2. Fill Supabase + Gemini credentials.
3. Set one worker scope initially, e.g. `AGENT_SCOPE=Baghdad`.

## 3. Start runtime API
```bash
npm run worker:api
```
Expect `/health` to return `{ ok: true }`.

## 4. Seed jobs
### Single job
```bash
curl -X POST http://localhost:4100/jobs \
  -H 'content-type: application/json' \
  -d '{"governorate":"Baghdad","city":"Baghdad","category":"restaurants","max_attempts":3}'
```

### Bulk jobs
```bash
npm run jobs:bootstrap
```
(using `SEED_*` env vars)

## 5. Run one worker
```bash
npm run worker:runtime
```
Verify job lifecycle in DB:
- `jobs.status` transitions `queued -> running -> completed|failed`
- `jobs.last_heartbeat_at` updates while running

## 6. Verify runtime artifacts
Check tables populate:
- `records` (upserts with conflict key)
- `job_events` (claimed/started/fetch_*/persisted/completed or failed)
- `job_results` (per-job metrics)
- `agent_states` (status + heartbeat + counters)

## 7. Verify retries + stale recovery
1. Start a worker and claim a job.
2. Kill worker process mid-job.
3. Wait beyond `WORKER_STALE_MS`.
4. Start worker again in same governorate scope.
5. Confirm stale job transitions to `retrying` (or `failed` at max attempts), then is reclaimed.

## 8. Verify multi-worker safety
1. Set `WORKER_SCOPES` for multiple governorates.
2. Run `npm run workers:scoped`.
3. Enqueue jobs across those governorates.
4. Confirm:
   - workers only claim jobs in their own `AGENT_SCOPE`
   - no double-claim on same job (`claim_next_job` RPC + row lock)
   - duplicate active jobs are rejected/deduplicated by API + DB index.
