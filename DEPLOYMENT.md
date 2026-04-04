# Deployment Guide

## 1) Supabase setup
1. Create a Supabase project.
2. Run `migrations/20260404_runtime_hardening.sql` in SQL editor.
3. Enable Realtime for `jobs`, `job_events`, `records`, `agent_states` if dashboard live updates are needed.

## 2) Frontend deployment (Vercel/static host)
- Deploy only the Vite frontend build (`npm run build`).
- Required env vars on frontend host:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - optional: `VITE_OPERATOR_EMAIL`
- Do **not** run runtime worker process on Vercel build/deploy.

## 3) Runtime API + worker deployment
Host this as a separate service/container (Railway/Fly/Render/VM/etc).

Required env vars:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` (required for worker/all mode)
- `RUNTIME_MODE` (`api`, `worker`, or `all`)
- worker identity vars: `AGENT_ID`, `AGENT_NAME`, `AGENT_SCOPE`

Startup guardrails fail fast when env vars, canonical tables, or required RPCs are missing.

Commands:
- API only: `npm run runtime:api`
- single worker: `npm run runtime:worker`
- API + worker in one process (small deployments): `npm run runtime:all`

## 4) Multi-agent launch (one worker per governorate)
Use the scoped launcher from one process supervisor unit.

### Linux/macOS shells
```bash
export WORKER_SCOPES="Baghdad,Basra,Erbil"
npm run runtime:workers:scoped
```

### Windows PowerShell
```powershell
$env:WORKER_SCOPES="Baghdad,Basra,Erbil"
npm run runtime:workers:scoped
```

(You can also pass scopes as a single argument: `npm run runtime:workers:scoped -- "Baghdad,Basra,Erbil"`.)

Each child gets unique `AGENT_ID`/`AGENT_NAME` and its own `AGENT_SCOPE`.

## 5) Enqueue jobs
- Single job: `POST /jobs`
- Bulk seed: `POST /jobs/bootstrap` or `npm run jobs:bootstrap`
- Duplicate active jobs are prevented by unique active-job index + API dedupe behavior.
