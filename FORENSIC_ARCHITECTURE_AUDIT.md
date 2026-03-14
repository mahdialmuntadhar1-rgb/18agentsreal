# Forensic Architecture Audit (Repository-Local Evidence)

## Scope and method
This audit is based on direct inspection of the code and git metadata inside this repository snapshot (`/workspace/18-AGENTS`). External dashboards/URLs were **not** treated as authoritative unless corroborated by repository evidence.

## Executive findings

1. **This repository is itself a full-stack app** (not just monitoring scripts):
   - Frontend: React + Vite + TypeScript + Tailwind.
   - Backend: Express server with API endpoints and orchestration hooks.
   - Data layer: Supabase for both public reads and admin writes.

2. **The runtime data model in code currently uses `businesses`, not `directory`**:
   - Frontend Home page reads from `businesses`.
   - Governor pipeline writes to `businesses` and logs to `agents` + `agent_logs`.
   - This conflicts with claims that production table is `directory`.

3. **Only one real governor is implemented (`Gov-01 Restaurants`)** while the Admin UX presents 18 governors with static metadata. This introduces operational observability drift.

4. **No git remote is configured in this clone**, so this local copy cannot prove which GitHub repo is currently connected to Vercel for production deployments.

## Proven architecture in this codebase

### Frontend layer
- React router exposes `/` (public directory) and `/admin` (operations dashboard).
- Public UI queries Supabase directly from browser using anon key.
- Category filtering and search are client-side over fetched records.

### Backend/orchestration layer
- Node/Express server serves API and Vite middleware in development.
- API endpoints manage in-memory agent status and trigger named governors.
- Governor registry currently includes only `Gov-01 Restaurants`.

### Data ingestion and persistence
- Governor flow: `gather -> validate -> store -> log`.
- Store behavior deduplicates by exact `(name, address)` then updates or inserts.
- Status and run logs are written into `agents` and `agent_logs` tables.

### External provider dependencies (configured by env)
- Supabase URL + anon key (frontend).
- Supabase service role key (backend governor writes).
- No external places API key is required; governors use realistic Iraqi mock business datasets.
- Gemini key appears in setup docs and Vite define for AI Studio context.

## Repository identity and connection certainty

### What is certain from repo evidence
- This repo contains deployable frontend + backend code in one project.
- It is AI Studio-originated (README links AI Studio app id `ff9d62c2-6311-42b0-93a6-e0ae5804afba`).
- It is intended as an "18 AI agents" business directory platform.

### What is not provable from this clone alone
- Which GitHub repository is connected to each Vercel project (`fuck-vcmu`, `fuck-three`, `fuck`, etc.).
- Which Supabase project/org is active production for current traffic.
- Whether other listed repos are mirrors, abandoned forks, or active deployment sources.

Reason: `.git/config` has no `[remote]` entries in this local snapshot.

## Duplication and drift risk assessment

### 1) Frontend duplication risk: **High**
Signals:
- Multiple frontend URLs/repo names are referenced externally.
- This repo itself includes frontend and admin UIs.
- No local remote linkage to identify canonical upstream.

Impact:
- Parallel changes can diverge UI behavior, env vars, and schema assumptions.

### 2) Data schema drift risk: **High**
Signals:
- Code uses table `businesses`, while prior narrative references table `directory`.
- Home page and ingestion paths depend on `businesses` semantics.

Impact:
- Silent empty results in UI, failed writes, or split datasets between tables.

### 3) Orchestrator reality gap risk: **High**
Signals:
- Admin dashboard visually models 18 governors, but registry has one real governor.
- Some API status is in-memory mock state instead of persisted runtime truth.

Impact:
- False confidence in enrichment coverage and uptime.

### 4) Environment/source-of-truth risk: **Medium-High**
Signals:
- AI Studio conventions, Vercel deployment references, and Supabase settings appear mixed.

Impact:
- Confusion over where secrets are sourced and which pipeline is authoritative.

## Canonical architecture decision (recommended)

Define one canonical chain and enforce it:

1. **Canonical code repo (single source):** choose exactly one GitHub repo for full-stack.
2. **Canonical deployment target(s):** one Vercel project per environment (prod/staging), no unnamed duplicates.
3. **Canonical data schema:** one table contract (`businesses` or `directory`) with migration and compatibility layer.
4. **Canonical orchestrator truth:** admin dashboard should render only registered governors from backend, not static mock list.

## Verification checklist to run next (outside this clone)

1. In Vercel each project, record linked GitHub repo + branch.
2. In GitHub, protect default branch in the chosen canonical repo.
3. In Supabase, confirm active table and RLS policies align with frontend query path.
4. Add deployment metadata endpoint exposing commit SHA + repo URL + schema version.
5. Decommission/archive duplicate repos or mark as read-only mirror.

## Bottom line
From repository-local forensic evidence, this project is a **single full-stack codebase** using React/Vite frontend + Express orchestrator + Supabase persistence. The biggest risks are **repo/deployment duplication** and **schema drift (`businesses` vs `directory`)**, not missing code.
