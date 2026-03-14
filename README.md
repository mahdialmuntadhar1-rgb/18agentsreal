<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ff9d62c2-6311-42b0-93a6-e0ae5804afba

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Agent runtime (server/governors)

Run the orchestrator + API server:

```bash
npm run dev
```

When the server boots it automatically calls `orchestrator.startAll()` and starts a recurring run loop.
You can also trigger it manually:

```bash
curl -X POST http://localhost:3000/api/orchestrator/start
curl -X POST http://localhost:3000/api/orchestrator/stop
curl -X POST http://localhost:3000/api/agents/Gov-01%20Restaurants/run
```

### Required environment variables

- `VITE_SUPABASE_URL` (required by client + server)
- `VITE_SUPABASE_ANON_KEY` (required by client)
- `SUPABASE_SERVICE_ROLE_KEY` (required by server writes)

Optional:

- `GOOGLE_PLACES_API_KEY` (if missing, `RestaurantsGovernor` returns mock data)
- `GEMINI_API_KEY` (used by the AI Studio app/runtime, not needed for the current governor pipeline)
- `AGENT_INTERVAL_MINUTES` (orchestrator schedule interval, defaults to 60)

## Long-term automation options

1. Keep a persistent process (PM2/systemd/Docker) running `npm run dev` or production `npm run start`.
2. Add a GitHub Actions scheduled workflow that calls the run endpoint.
3. Add Vercel Cron to call `/api/orchestrator/start` or `/api/agents/:agentName/run`.
