# 18-AGENTS — Iraq Compass Data Dashboard

  Internal tool to clean, verify, and approve 70,000+ Iraqi business records across 18 governorates.

  ## Branch Strategy

  - `main` → AI Studio generated code (source of truth)
  - `production` → Stable, fixed, deployment-ready version

  ## Project Structure

  ```
  ├── server.ts          # Express + Vite dev server
  ├── server/governors/  # Agent governor logic
  ├── src/               # React frontend
  │   ├── pages/         # Route pages
  │   ├── components/    # UI components
  │   ├── lib/           # Supabase client, utilities
  │   └── services/      # API services
  ├── vite.config.ts
  └── tsconfig.json
  ```

  ## Environment Variables

  Copy `.env.example` to `.env` and fill in your values:

  ```
  VITE_SUPABASE_URL=         # Your Supabase project URL
  VITE_SUPABASE_ANON_KEY=    # Your Supabase anon/public key
  GEMINI_API_KEY=            # Optional: Gemini API key for AI agents
  ```

  ## Run on Replit

  1. Import this repository into Replit (use the production branch).
  2. Go to **Secrets** and add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `GEMINI_API_KEY` (optional)
  3. Run `npm install` in the Shell if dependencies are not auto-installed.
  4. Click **Run** — the app starts via `npm run dev`.

  ## Commands

  | Command         | Description                                      |
  |-----------------|--------------------------------------------------|
  | `npm run dev`   | Start development server (Express + Vite HMR)   |
  | `npm run build` | Build frontend for production                    |
  | `npm start`     | Start production server                          |
  | `npm run lint`  | TypeScript type check                            |

  ## Deploy on Replit

  1. Set **build command** to `npm run build`
  2. Set **run command** to `npm start`
  3. Add all environment variables to Replit Secrets

  ## Features

  - **Overview**: Real-time metrics of raw vs verified data
  - **Review Table**: Batch approve/reject businesses by verification score
  - **Data Cleaner**: Fix encoding issues in Arabic/Kurdish text
  - **Task Manager**: Launch automated data enrichment agents
  - **Export**: Generate clean JSON for the public directory
  - **Agent Commander**: Control all 18 governorate agents

  ## Supabase Schema

  Execute the SQL in `supabase_schema.sql` in your Supabase SQL Editor before running the app.

  ## Language Support

  - Full RTL support for Arabic and Kurdish
  - Trilingual data fields (AR, KU, EN)
  