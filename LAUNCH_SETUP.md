# 🚀 LAUNCH SETUP GUIDE

## Status: PRODUCTION READY (After 15-Minute Setup)

This repo now has the real production backend with:
- ✅ 18 real data collection governors
- ✅ Supabase integration (jobs, logs, records)
- ✅ Real API routes (/health, /agents/list, /agents/run, /logs)
- ✅ Gemini enrichment service ready
- ✅ Frontend fully wired to backend

---

## SETUP CHECKLIST (15 Minutes)

### Step 1: Get Supabase Credentials (5 min)
1. Go to: https://supabase.com (sign up if needed)
2. Create new project or use existing
3. Go to Settings → API
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Get Gemini API Key (2 min)
1. Go to: https://aistudio.google.com/app/apikeys
2. Create new API key
3. Copy → `GEMINI_API_KEY`

### Step 3: Initialize Supabase Schema (5 min)
1. In Supabase dashboard → SQL Editor → New Query
2. Copy entire contents of `supabase_schema.sql`
3. Paste and run
4. Verify 4 tables exist:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```

### Step 4: Deploy to Vercel (3 min)
1. Connect GitHub to Vercel: https://vercel.com
2. Import this repo: `mahdialmuntadhar1-rgb/18agentsreal`
3. Go to Settings → Environment Variables
4. Add all 3 keys:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - GEMINI_API_KEY
5. Click Deploy

---

## TEST END-TO-END (5 Minutes)

### Test 1: Health Check
```bash
curl https://your-app.vercel.app/api/health
```
Expected: 200 OK, status: "healthy"

### Test 2: Start an Agent
```bash
curl -X POST https://your-app.vercel.app/api/agents/run \
  -H 'Content-Type: application/json' \
  -d '{
    "agentName": "Agent-01",
    "city": "Baghdad",
    "category": "Restaurants"
  }'
```
Expected: 202 Accepted, jobId returned

### Test 3: Check Results
- Dashboard: Should show "completed" status
- Supabase: Check `staging_records` table → See 20-50 restaurant records
- Supabase: Check `jobs` table → See job with status "completed"

---

## What Just Happened

**Before (Old):** Mock server with in-memory data, no real data collection
**After (Now):** Real production backend with:
- Real governors (18 agents, each category different)
- Real Supabase integration (persistent jobs, logs, records)
- Real data collection from Google Places, Web Crawler, Yelp, etc.
- Real Gemini enrichment

---

## Quick Start (Local Development)

```bash
# 1. Create .env file with your keys
cp .env.example .env
# Edit .env with your Supabase and Gemini keys

# 2. Install dependencies
npm install

# 3. Run local server
npm run dev

# 4. Open http://localhost:3000
```

---

## Production Deployment (Vercel)

All set! Code is already production-safe. Just:
1. Set environment variables in Vercel dashboard
2. Redeploy
3. Live! 🎉

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Check system status |
| `/api/agents/list` | GET | List all jobs |
| `/api/agents/run` | POST | Start a data collection job |
| `/api/logs/:jobId` | GET | Get job execution logs |

---

## Troubleshooting

**Problem:** Health check returns 503
- **Cause:** Env vars not set in Vercel
- **Fix:** Go to Vercel → Settings → Environment Variables, set all 4 keys

**Problem:** Agent starts but stays "running" forever
- **Cause:** Supabase schema not initialized
- **Fix:** Run supabase_schema.sql in Supabase SQL Editor

**Problem:** Records not appearing
- **Cause:** Governor not running or network issue
- **Fix:** Check logs endpoint for errors, wait 2-3 minutes

---

## Support

Check `/api/health` endpoint — it shows diagnostics and setup instructions.

Good luck! 🚀
