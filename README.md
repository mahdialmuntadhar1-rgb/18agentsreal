# Business Data Enrichment System (18 Autonomous Governorate Agents)

This project now includes a production-ready enrichment orchestrator that runs **18 autonomous agents**, each restricted to a single Iraqi governorate. Agents pull incomplete business rows from Supabase in batches, verify data from public sources, normalize multilingual text (Arabic/Kurdish/English), and write structured enrichment payloads back to Supabase.

## Architecture

### Core components

1. **Agent Orchestration System**
   - `server/orchestrator.ts`
   - Boots 18 agent instances and exposes run/stop controls.

2. **Enrichment Worker Agents**
   - `server/enrichment-agent.ts`
   - One agent per governorate, batch size = 50, sleep = 5 seconds.
   - Agent never touches records outside its assigned governorate.

3. **Supabase Integration**
   - `server/supabase-admin.ts`
   - `server/repository.ts`
   - Handles read/update operations for `businesses`, `agents`, `agent_logs`.

4. **Queue/Batch System**
   - Pull-based queue from Supabase using filters:
     - `governorate = assigned governorate`
     - `enriched IS NULL OR enriched = false`
   - Agents process in repeat cycles.

5. **Reliable Source Layer**
   - `server/data-sources.ts`
   - Priority order supported in system model:
     1. Google Maps
     2. Official website
     3. Facebook
     4. Instagram
     5. Local directories (extensible)
     6. Government registries (extensible)

6. **Normalization + Data Quality**
   - `server/text-normalization.ts`
   - Fixes common Arabic/Kurdish mojibake patterns and spacing issues.
   - If unverifiable, values remain `null`.

7. **Monitoring + Logging**
   - Agent status updates in `agents`.
   - Batch metrics in `agent_logs`.

## 18-Agent Distribution

1. Agent-01 → Erbil
2. Agent-02 → Sulaymaniyah
3. Agent-03 → Duhok
4. Agent-04 → Baghdad
5. Agent-05 → Basra
6. Agent-06 → Nineveh
7. Agent-07 → Kirkuk
8. Agent-08 → Najaf
9. Agent-09 → Karbala
10. Agent-10 → Anbar
11. Agent-11 → Babil
12. Agent-12 → Diyala
13. Agent-13 → Dhi Qar
14. Agent-14 → Maysan
15. Agent-15 → Muthanna
16. Agent-16 → Qadisiyyah
17. Agent-17 → Wasit
18. Agent-18 → Salah al-Din

## API Endpoints

- `GET /api/health`
- `GET /api/agents`
- `POST /api/agents/:governorate/run` (single batch run)
- `POST /api/orchestrator/start` (continuous mode)
- `POST /api/orchestrator/stop`

## Enrichment output model

Each enriched business is written in structured JSON shape:

```json
{
  "name": "",
  "category": "",
  "phone_number": "",
  "website": "",
  "address": "",
  "city": "",
  "governorate": "",
  "latitude": null,
  "longitude": null,
  "google_maps_url": "",
  "opening_hours": "",
  "facebook_url": "",
  "instagram_url": "",
  "logo_image_url": "",
  "cover_image_url": "",
  "gallery_images": [],
  "short_description": "",
  "status": "enriched",
  "verified_sources": ["google_maps"],
  "enriched": true,
  "last_checked": "2026-01-01T00:00:00.000Z"
}
```

If business cannot be verified, status is `not_found` and uncertain fields stay `null`.

## Required environment variables

Add to `.env`:

```bash
VITE_SUPABASE_URL=https://mxxaxhrtccomkazpvthn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_PLACES_API_KEY=your_google_api_key
PORT=3000
```

## Deployment instructions

### Local

```bash
npm install
npm run lint
npm run dev
```

Then:
- `POST /api/orchestrator/start` to start all 18 agents continuously.
- Or run one governorate manually with `POST /api/agents/Baghdad/run`.

### Vercel / Node deployment

1. Set environment variables in deployment dashboard.
2. Ensure Node runtime supports `fetch` (Node 18+).
3. Deploy.
4. Trigger `/api/orchestrator/start` via scheduler or operator endpoint.

### Supabase table assumptions

- `businesses` has enrichment fields listed above.
- `agents` table keyed by `agent_name`.
- `agent_logs` table stores per-batch metrics.

## Notes

- System strictly avoids fabricated data.
- Image fields are URL-based and only populated from verifiable sources.
- Local directory / government registry providers can be added by implementing `SourceProvider` in `server/data-sources.ts`.
