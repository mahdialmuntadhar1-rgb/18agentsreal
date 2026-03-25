# 18-AGENTS Internal Dashboard

Internal AI agent management dashboard for orchestration, review, QA, and reporting workflows.

## Project Scope

- This repository is **only** for the 18-AGENTS dashboard.
- Supabase project for this app: `https://mxxaxhrtccomkazpvthn.supabase.co`.
- Do **not** reference Iraq Compass frontend design in this codebase.
- Do **not** use or modify the Iraq Compass Supabase project from this repository.

## Setup Instructions for Replit

1. **Create a new Replit** using the "React" template.
2. **Upload all files** from this repository to your Replit.
3. **Configure Environment Variables**:
   - Go to the **Secrets** tab in Replit.
   - Add `VITE_SUPABASE_URL` with your Supabase project URL.
   - Add `VITE_SUPABASE_ANON_KEY` with your Supabase anon key.
4. **Install Dependencies**:
   - Replit should automatically detect `package.json` and install dependencies.
   - If not, run `npm install` in the Shell.
5. **Run the App**:
   - Click the **Run** button at the top.
   - The dashboard will be available in the Webview.

## Cloudflare Worker Secrets (Required)

Set these secrets in your Cloudflare Worker dashboard (or via `wrangler secret put`) before running pipelines:

- `GEMINI_API_KEY`
- `VITE_SUPABASE_URL` (for this project: `https://mxxaxhrtccomkazpvthn.supabase.co`)
- `VITE_SUPABASE_ANON_KEY`

## Supabase Schema

Before running the app, ensure you have executed the SQL schema provided in the `Step 1` response in your Supabase SQL Editor.

## Features

- **Overview**: Real-time metrics of raw vs verified data.
- **Review Table**: Batch approve or reject records based on verification scores.
- **Data Cleaner**: Repair encoding issues (mojibake) in multilingual text.
- **Task Manager**: Launch automated agent tasks for enrichment.
- **Export**: Generate clean JSON outputs for downstream systems.

## Language Support

- Full RTL support for Arabic and Kurdish.
- Trilingual data fields (AR, KU, EN).
- `dir="rtl"` implemented on relevant UI components.
