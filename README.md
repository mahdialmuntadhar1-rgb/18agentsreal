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

## Runtime truthfulness

- Runtime agent status, task queueing, and log history are read from/written to Supabase tables (`agents`, `agent_tasks`, `agent_logs`).
- Orchestrator endpoints (`/api/orchestrator/start`, `/api/orchestrator/stop`) persist status/task/log changes before responding.
- Manual agent runs (`/api/agents/:agentName/run`) create and update persisted run-task records.
- Pages still marked as placeholders (for example `/overview`) are explicitly labeled as non-operational and are not part of production runtime control flow.
- No Firebase runtime paths are retained.
