-- ============================================================
-- PRODUCTION RESET SCRIPT
-- Safely clears production business data while preserving schema
-- Run this in Supabase SQL Editor before fresh sync
-- ============================================================

-- Step 1: Check current row count
select count(*) as current_business_count from businesses;

-- Step 2: Check for foreign key dependencies
-- (If there are any dependent tables, handle them first)
-- Common pattern: reviews, bookings, favorites might reference businesses

-- Step 3: Delete all business records (preserves table structure)
-- This is safer than TRUNCATE if there are foreign keys
DELETE FROM businesses;

-- Step 4: Reset any sequences if using serial/bigserial columns
-- ALTER SEQUENCE businesses_id_seq RESTART WITH 1;

-- Step 5: Verify deletion
select count(*) as remaining_business_count from businesses;

-- Step 6: Check for invalid phone lengths (should be 0 rows after sync)
-- This is a verification query for after the sync
-- SELECT 
--   count(*) as invalid_phone_count,
--   count(*) filter (where length(regexp_replace(phone, '\D', '', 'g')) != 11) as not_11_digits
-- FROM businesses;

-- Optional: Soft reset (mark as inactive instead of delete)
-- Uncomment if you want to keep records but mark them inactive
-- UPDATE businesses SET status = 'inactive', is_published = false;

-- ============================================================
-- VERIFICATION QUERIES
-- Run these after sync to confirm data quality
-- ============================================================

-- Count total businesses
-- SELECT count(*) FROM businesses;

-- Count by verification status
-- SELECT verification_status, count(*) FROM businesses GROUP BY verification_status;

-- Count businesses with invalid phone (should be 0)
-- SELECT count(*) FROM businesses 
-- WHERE phone IS NULL 
-- OR length(regexp_replace(phone, '\D', '', 'g')) != 11;

-- Check phone length distribution
-- SELECT 
--   length(regexp_replace(phone, '\D', '', 'g')) as phone_digit_count,
--   count(*)
-- FROM businesses
-- WHERE phone IS NOT NULL
-- GROUP BY length(regexp_replace(phone, '\D', '', 'g'))
-- ORDER BY phone_digit_count;

-- Verify category distribution (should show HUMUS 15 categories)
-- SELECT category, count(*) FROM businesses GROUP BY category ORDER BY count(*) DESC;
