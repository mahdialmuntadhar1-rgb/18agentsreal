# Iraq Compass Dashboard

Supabase-first React + Express dashboard for business data operations.

## Environment

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY` (optional for AI enrichment features)
- `SUPABASE_URL` (server-side)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side)

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```

## Repository Analyzer

Run the Codex Analyzer to generate a health report for structure, env coverage, schema alignment, placeholders, and lint status:

```bash
npm run analyze:repo
```

The command writes `CODEX_REPORT.md` in the repo root.

## Runtime truthfulness

- Runtime agent status, task queueing, and log history are read from/written to Supabase tables (`agents`, `agent_tasks`, `agent_logs`).
- Orchestrator endpoints (`/api/orchestrator/start`, `/api/orchestrator/stop`) persist status/task/log changes before responding.
- Manual agent runs (`/api/agents/:agentName/run`) create and update persisted run-task records.
- Pages still marked as placeholders (for example `/overview`) are explicitly labeled as non-operational and are not part of production runtime control flow.
- No Firebase runtime paths are retained.


## First real scraping test contract

- **Canonical first real agent:** `Agent-01` (`RestaurantsGovernor`).
- **Real connector:** Google Places Text Search API.
- **Required connector secret:** `GOOGLE_PLACES_API_KEY` (server-side).
- **Runtime output table:** `businesses` (rows written by `BaseGovernor.store`).
- **Runtime control tables:** `agents`, `agent_tasks`, `agent_logs`.
- **Schema source of truth:** `supabase_schema.sql`.
