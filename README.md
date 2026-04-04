<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 18agentsreal collection runtime

Supabase-backed multi-agent collection runtime with DB-backed frontend observability.

## Local run
1. `npm install`
2. Copy `.env.example` to `.env` and configure values.
3. Frontend: `npm run dev`
4. Runtime API: `npm run worker:api`
5. Worker: `npm run worker:runtime`

## Useful scripts
- `npm run worker:all` - API + worker in one process.
- `npm run workers:scoped` - start one worker process per scope in `WORKER_SCOPES`.
- `npm run jobs:bootstrap` - seed jobs through runtime API.

See `DEPLOYMENT.md` for production hosting split and `VALIDATION.md` for proof-of-execution steps.
