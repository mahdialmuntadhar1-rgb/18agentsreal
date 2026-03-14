# AI Business Directory + Agent Orchestrator

This project runs a Next-style frontend dashboard and an Express-based orchestration API that drives **18 worker agents** against Supabase.

## Architecture

- **Task Queue**: `agent_tasks` in Supabase
- **Workers (18)**: claim pending tasks using `FOR UPDATE SKIP LOCKED`
- **Validation + Upsert**: data is validated then upserted into `businesses`
- **Frontend Grid**: reads directly from `businesses`
- **Realtime**: `postgres_changes` subscription refreshes the dashboard when new rows are inserted
- **Manager Agent**: watches worker heartbeats, seeds tasks when queue is empty, and monitors duplicates

Flow:

`Task Queue → Agent → Processing → Validation → Insert Business → Mark Task Complete`

## Required Supabase setup

Run SQL in `supabase/schema.sql` to create:

- `agent_tasks`
- `businesses`
- unique index on `(name, city)`
- `claim_next_agent_task(p_agent_name text)` queue claim function
- realtime publication for `businesses`

## Categories

Agents and frontend both use these exact values:

- `restaurants`
- `cafes`
- `bakeries`
- `hotels`
- `gyms`
- `beauty_salons`
- `pharmacies`
- `supermarkets`

## Local run

1. Install dependencies: `npm install`
2. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Start app: `npm run dev`
4. Open dashboard at `/admin`

Use `/api/orchestrator/start` to start workers and manager.
