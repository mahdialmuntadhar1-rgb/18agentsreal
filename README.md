<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 18agentsreal collection runtime

Supabase-backed multi-agent collection runtime with DB-backed frontend observability.

## Canonical runtime entrypoints
- API: `npm run runtime:api`
- Worker: `npm run runtime:worker`
- API + worker in one process: `npm run runtime:all`
- Multi-worker launcher (scoped): `npm run runtime:workers:scoped`

Legacy `server/index.ts` and `server/worker/collection-runner.ts` are deprecated and intentionally blocked.

## Local run
1. `npm install`
2. Copy `.env.example` to `.env` and configure values.
3. Apply `migrations/20260404_runtime_hardening.sql` in Supabase.
4. Start frontend: `npm run dev`
5. Start runtime API: `npm run runtime:api`
6. Start worker: `npm run runtime:worker`

## Useful scripts
- `npm run runtime:workers:scoped` - start one worker process per scope in `WORKER_SCOPES`.
- `npm run jobs:bootstrap` - seed jobs through runtime API.

See `DEPLOYMENT.md` for production hosting split and `VALIDATION.md` for proof-of-execution steps.
