# Iraq Compass Data Verification Dashboard

Internal tool to clean, verify, and approve 70,000+ Iraqi business records.

## Setup Instructions for Replit

1. **Create a new Replit** using the "React" template.
2. **Upload all files** from this repository to your Replit.
3. **Configure Environment Variables**:
   - Go to the **Secrets** tab in Replit.
   - Add `VITE_SUPABASE_URL` with your Supabase project URL.
   - Add `VITE_SUPABASE_ANON_KEY` with your Supabase anon key.
   - Add `SUPABASE_SERVICE_ROLE_KEY` for server-side agent writes.
   - Add `SUPABASE_JWT_SECRET` so protected `/api/*` routes can verify auth tokens.
   - Add `GEMINI_API_KEY` to enable real LLM-backed agent runs from Agent Commander.
4. **Install Dependencies**:
   - Replit should automatically detect `package.json` and install dependencies.
   - If not, run `npm install` in the Shell.
5. **Run the App**:
   - Click the **Run** button at the top.
   - The dashboard will be available in the Webview.

## Supabase Schema

Before running the app, execute `supabase_schema.sql` in Supabase SQL Editor.  
It includes:
- agent state tables (`agents`, `agent_tasks`, `agent_logs`)
- business output table (`businesses`)
- concurrency-safe RPC (`claim_next_task`)
- RLS and policies needed by frontend and backend

Without this schema, the dashboard can render but orchestration actions will fail.

## Features

- **Overview**: Real-time metrics of raw vs verified data.
- **Review Table**: Batch approve or reject businesses based on verification scores.
- **Data Cleaner**: Repair encoding issues (mojibake) in Arabic/Kurdish text.
- **Task Manager**: Launch automated agent tasks for data enrichment.
- **Export**: Generate clean JSON files ready for the public directory.

## Language Support

- Full RTL support for Arabic and Kurdish.
- Trilingual data fields (AR, KU, EN).
- Dir="rtl" implemented on relevant UI components.
