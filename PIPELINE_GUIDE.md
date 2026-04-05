# HUMUS Data Pipeline - Operator Guide

## Quick Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HUMUS DATA PIPELINE FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CSV UPLOAD / SCRAPER                                                        │
│         │                                                                     │
│         ▼                                                                     │
│   ┌─────────────────────────┐                                               │
│   │  businesses_import        │  ← STAGING TABLE (service role only)          │
│   │  (raw/staging data)      │  ← Raw, messy data lands here first           │
│   │  • processing_status     │  • Can see exactly what came in               │
│   │  • import_errors[]       │  • Can be deleted after processing            │
│   └─────────────────────────┘                                               │
│         │                                                                     │
│         │  CLEANING PROCESS (happens in backend/scraper code)               │
│         │  • Normalize phone numbers (+964XXXXXXXXXX)                         │
│         │  • Fix city/governorate names                                     │
│         │  • Validate URLs                                                  │
│         │  • Check for duplicates                                           │
│         ▼                                                                     │
│   ┌─────────────────────────┐                                               │
│   │  DEDUPLICATION CHECK    │                                               │
│   │  • Same name + city?    │                                               │
│   │  • Same phone?          │                                               │
│   │  • Same website?        │                                               │
│   └─────────────────────────┘                                               │
│         │                                                                     │
│         ├─ Duplicate? ──► UPDATE existing in businesses                      │
│         │                                                                     │
│         └─ New? ───────► INSERT to businesses                              │
│         ▼                                                                     │
│   ┌─────────────────────────┐                                               │
│   │  businesses             │  ← PRODUCTION TABLE (public read)              │
│   │  (live/production data) │  ← Clean, final data for the live app          │
│   │  • status='active'     │  • Frontend reads from HERE only               │
│   │  • confidence_score    │  • RLS: public can read, service can write     │
│   └─────────────────────────┘                                               │
│         │                                                                     │
│         ▼                                                                     │
│    HUMUS FRONTEND (React app)                                               │
│    • Reads from `businesses` table only                                     │
│    • Filters by city, governorate, category                                  │
│    • Displays enriched data (rating from confidence_score)                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Table Reference

| Table | Purpose | Who Writes | Who Reads | When to Clear |
|-------|---------|------------|-----------|---------------|
| `businesses_import` | Raw/staging data | Backend/scraper | Backend only | After processing |
| `businesses` | Live production data | Backend only | Public + Frontend | Never (this is the real data) |
| `import_batches` | Track import jobs | Backend | Operator | Keep for history |

---

## Environment Variables Required

Add these to your `.env` file (or Vercel environment variables):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

**Where to get these:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Project Settings → API
4. Copy:
   - `VITE_SUPABASE_URL` = "Project URL"
   - `VITE_SUPABASE_ANON_KEY` = "Project API keys" → `anon public`

---

## Common Operations

### 1. Check Import Status

```sql
-- See how many records are in each processing stage
SELECT processing_status, COUNT(*) 
FROM businesses_import 
GROUP BY processing_status;
```

### 2. View Recent Production Data

```sql
-- See latest businesses added to production
SELECT business_name, city, category, created_at 
FROM businesses 
ORDER BY created_at DESC 
LIMIT 20;
```

### 3. Clear Processed Import Data

```sql
-- Delete records that have been published to production
DELETE FROM businesses_import 
WHERE processing_status = 'published';
```

### 4. Check for Duplicates

```sql
-- Find potential duplicates in production
SELECT business_name, city, phone_1, COUNT(*) 
FROM businesses 
GROUP BY business_name, city, phone_1 
HAVING COUNT(*) > 1;
```

### 5. Data Quality Summary

```sql
-- View quality metrics by category
SELECT 
    category,
    COUNT(*) as total_businesses,
    COUNT(phone_1) as with_phone,
    AVG(confidence_score) as avg_confidence
FROM businesses
WHERE status = 'active'
GROUP BY category;
```

---

## Data Flow Steps

### Step 1: Import Raw Data

**Methods:**
- CSV upload → `businesses_import` table
- Scraper → `businesses_import` table
- Manual entry → Can go directly to `businesses` (if verified)

**Required fields for import:**
- `business_name` (required)
- `category` (required)
- `governorate` (required)
- `city` (required)
- `source` (required: 'csv_import', 'gemini', 'web_directory', etc.)

**Optional fields:**
- `arabic_name`, `english_name`
- `subcategory`, `neighborhood`, `address`
- `phone_1`, `phone_2`, `whatsapp`, `email`, `website`
- `facebook`, `instagram`, `tiktok`, `telegram`
- `opening_hours`, `status`, `source_url`, `raw_data`

### Step 2: Cleaning (Automatic)

The backend/scraper code should:
1. **Normalize phone numbers:** Convert to `+964XXXXXXXXXX` format
2. **Standardize locations:** Fix spelling variations of governorates/cities
3. **Validate URLs:** Ensure `https://` prefix
4. **Trim whitespace:** Clean up names and addresses

### Step 3: Deduplication (Automatic)

Before inserting to `businesses`, check for duplicates:

| Match Criteria | Confidence | Action |
|----------------|------------|--------|
| Same `phone_1` + same `city` | 99% | Update existing |
| Same `website` + same `city` | 95% | Update existing |
| Same `business_name` + same `city` + same `neighborhood` | 90% | Update existing |
| Same `facebook` + same `city` | 85% | Update existing |

**Update logic:**
- If new record has HIGHER `confidence_score` → UPDATE existing
- If same confidence, newer wins → UPDATE existing
- If lower confidence → SKIP (keep existing)

### Step 4: Production Table

After deduplication:
- **New business** → INSERT with `published_at = now()`
- **Duplicate with better data** → UPDATE existing record
- **Duplicate with worse data** → SKIP, log reason

### Step 5: Frontend Display

The React app (`HomePage.tsx`):
1. Calls `fetchBusinesses()` from `src/lib/supabase.ts`
2. Queries `businesses` table (not `businesses_import`)
3. Filters by `status = 'active'`
4. Sorts by `confidence_score` descending
5. Enriches with computed fields (rating, image, isFeatured)

---

## Frontend-to-Database Field Mapping

| Frontend Display | Database Column | Notes |
|-----------------|-----------------|-------|
| Business name | `business_name` | Primary display name |
| Arabic name | `arabic_name` | Optional |
| Category | `category` | Used for filtering |
| Governorate | `governorate` | Used for filtering |
| City | `city` | Used for filtering |
| Address | `address` | Full street address |
| Phone | `phone_1` | Primary phone number |
| Rating | Computed from `confidence_score` | `rating = 3 + (confidence * 2)` |
| Image | Computed from `business_name` | UI Avatars API |
| Is Featured | Computed from `confidence_score` | `isFeatured = confidence > 0.7` |

---

## Troubleshooting

### Frontend shows no businesses

1. Check environment variables are set:
   ```bash
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

2. Verify `businesses` table has data:
   ```sql
   SELECT COUNT(*) FROM businesses WHERE status = 'active';
   ```

3. Check RLS policies are correct:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'businesses';
   ```

### Import data not appearing in frontend

- Verify data was moved from `businesses_import` → `businesses`
- Check `processing_status = 'published'` in import table
- Verify `status = 'active'` in production table

### Duplicate businesses showing

- Check deduplication logic in your import pipeline
- The unique index `idx_businesses_dedupe` prevents exact duplicates
- Similar names in different neighborhoods are allowed

---

## Summary

**Remember:**
1. **Only the `businesses` table** is read by the frontend
2. **`businesses_import` is temporary** - can be cleared after processing
3. **Production data is precious** - never delete without backup
4. **Service role** writes to both tables, **public** only reads `businesses`

**The simple rule:**
```
Raw data → businesses_import → [cleaning/dedup] → businesses → Frontend
```
