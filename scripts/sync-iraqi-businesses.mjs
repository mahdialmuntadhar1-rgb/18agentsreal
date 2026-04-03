#!/usr/bin/env node
/**
 * Sync Pipeline: Scraper DB → Production DB
 * Fetches clean records from iraqi_businesses and pushes to production business table
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// ── CONFIGURATION ───────────────────────────────────────────────────────────

const SCRAPER_URL = process.env.SCRAPER_SUPABASE_URL || 'https://mxxaxhrtccomkazpvthn.supabase.co';
const SCRAPER_KEY = process.env.SCRAPER_SUPABASE_KEY;

const PROD_URL = process.env.PROD_SUPABASE_URL || 'https://hsadukhmcclwixuntqwu.supabase.co';
const PROD_KEY = process.env.PROD_SUPABASE_KEY;

if (!SCRAPER_KEY || !PROD_KEY) {
  console.error('❌ Error: SCRAPER_SUPABASE_KEY and PROD_SUPABASE_KEY must be set in .env');
  console.error('   Add these to your .env file:');
  console.error('   SCRAPER_SUPABASE_URL=https://mxxaxhrtccomkazpvthn.supabase.co');
  console.error('   SCRAPER_SUPABASE_KEY=<your-service-role-key>');
  console.error('   PROD_SUPABASE_URL=https://hsadukhmcclwixuntqwu.supabase.co');
  console.error('   PROD_SUPABASE_KEY=<your-service-role-key>');
  process.exit(1);
}

// ── CLIENTS ────────────────────────────────────────────────────────────────

const scraperDB = createClient(SCRAPER_URL, SCRAPER_KEY);
const prodDB = createClient(PROD_URL, PROD_KEY);

// ── FIELD MAPPING ───────────────────────────────────────────────────────────

/**
 * Map fields from iraqi_businesses → businesses
 * Only transforms real businesses (with valid phone + name)
 */
function transformRecord(record) {
  const hasPhone = hasValidPhone(record);
  const isReal = isRealBusiness(record);
  const normalizedPhone = getNormalizedPhone(record);
  
  // Only return fields that exist in production 'businesses' table
  return {
    // Core fields
    business_name: record.name || record.title || 'Unknown',
    category: normalizeCategory(record.category || record.type || 'other'),
    city: record.city || record.governorate || record.location || 'Unknown',
    address: record.address || record.street || record.location_details || null,
    phone: normalizedPhone,  // Guaranteed to be exactly 11 digits or null
    
    // Optional fields
    email: record.email || null,
    website: record.website || record.url || record.site || null,
    
    // Location
    latitude: parseFloat(record.latitude || record.lat || record.y) || null,
    longitude: parseFloat(record.longitude || record.lon || record.x) || null,
    
    // Status - only publish if phone is valid 11 digits
    verification_status: mapStatus(record.status || record.verification_status || 'pending', hasPhone),
    is_published: isReal && !!normalizedPhone,  // Must have valid 11-digit phone to publish
    
    // Metadata
    _is_real: isReal,  // Internal tracking only, removed before insert
    _phone_digits: normalizedPhone ? normalizedPhone.length : 0,  // Track phone digit count for debugging
  };
}

function normalizeCategory(raw) {
  if (!raw) return 'other';
  const lower = raw.toLowerCase().trim();
  
  // Map scraper categories to HUMUS 15 categories
  const map = {
    // Dining & Cuisine
    'restaurant': 'food_drink',
    'restaur': 'food_drink',
    'dining': 'food_drink',
    'food': 'food_drink',
    
    // Coffee & Cafes (new category)
    'cafe': 'cafe',
    'coffee': 'cafe',
    'cafes': 'cafe',
    'tea house': 'cafe',
    
    // Accommodation & Stays
    'hotel': 'hotels_stays',
    'motel': 'hotels_stays',
    'stay': 'hotels_stays',
    'accommodation': 'hotels_stays',
    
    // Shopping & Retail
    'shop': 'shopping',
    'retail': 'shopping',
    'store': 'shopping',
    'market': 'shopping',
    'mall': 'shopping',
    'clothing': 'shopping',
    'electronics': 'shopping',
    'furniture': 'shopping',
    'pharmacy': 'shopping',
    'pharmacies': 'shopping',
    
    // Health & Wellness (general)
    'healthcare': 'health_wellness',
    'health': 'health_wellness',
    'wellness': 'health_wellness',
    'medical': 'health_wellness',
    
    // Doctors (specific)
    'doctor': 'doctors',
    'physician': 'doctors',
    'dr.': 'doctors',
    
    // Lawyers (specific)
    'lawyer': 'lawyers',
    'attorney': 'lawyers',
    'legal': 'lawyers',
    
    // Clinics (specific)
    'clinic': 'clinics',
    'medical clinic': 'clinics',
    
    // Hospitals (specific)
    'hospital': 'hospitals',
    'medical center': 'hospitals',
    'infirmary': 'hospitals',
    
    // Education
    'education': 'education',
    'school': 'education',
    'university': 'education',
    'college': 'education',
    'academy': 'education',
    
    // Business & Services
    'bank': 'business_services',
    'finance': 'business_services',
    'financial': 'business_services',
    'office': 'business_services',
    'service': 'business_services',
    'consulting': 'business_services',
    
    // Transport & Mobility
    'gas station': 'transport_mobility',
    'fuel': 'transport_mobility',
    'gas': 'transport_mobility',
    'car repair': 'transport_mobility',
    'mechanic': 'transport_mobility',
    'automotive': 'transport_mobility',
    'transport': 'transport_mobility',
    'bus': 'transport_mobility',
    'taxi': 'transport_mobility',
    
    // Public & Essential
    'government': 'public_essential',
    'public': 'public_essential',
    'essential': 'public_essential',
    'police': 'public_essential',
    'fire': 'public_essential',
    'post office': 'public_essential',
    
    // Entertainment & Events
    'entertainment': 'events_entertainment',
    'event': 'events_entertainment',
    'cinema': 'events_entertainment',
    'theater': 'events_entertainment',
    'sports': 'events_entertainment',
    
    // Culture & Heritage
    'tourism': 'culture_heritage',
    'attraction': 'culture_heritage',
    'museum': 'culture_heritage',
    'heritage': 'culture_heritage',
    'culture': 'culture_heritage',
    'mosque': 'culture_heritage',
    'church': 'culture_heritage',
    'temple': 'culture_heritage',
    'historical': 'culture_heritage',
    'landmark': 'culture_heritage',
  };
  
  for (const [key, value] of Object.entries(map)) {
    if (lower.includes(key)) return value;
  }
  
  // Default mapping for unknown categories
  if (lower.includes('religious')) return 'culture_heritage';
  if (lower.includes('bus_stat')) return 'transport_mobility';
  
  return 'other';
}

function cleanPhone(phone) {
  if (!phone) return null;
  
  // Normalize: strip all non-digit characters (spaces, dashes, +, parentheses, etc.)
  const digitsOnly = phone.toString().replace(/\D/g, '');
  
  // CRITICAL: Must be EXACTLY 11 digits for Iraqi mobile numbers
  // Examples:
  //   "07701234567" -> "07701234567" (valid)
  //   "0770 123 4567" -> "07701234567" (valid after normalization)
  //   "+9647701234567" -> INVALID (13 digits, not 11)
  //   "770123456" -> INVALID (9 digits)
  if (digitsOnly.length !== 11) return null;
  
  return digitsOnly;
}

/**
 * Normalize Iraqi phone with country code to local 11-digit format
 * +9647701234567 -> 07701234567
 * Returns null if cannot normalize to exactly 11 digits
 */
function normalizeIraqiPhone(phone) {
  if (!phone) return null;
  
  const digitsOnly = phone.toString().replace(/\D/g, '');
  
  // If already 11 digits, return as-is (already in local format)
  if (digitsOnly.length === 11) {
    return digitsOnly;
  }
  
  // Handle +964 international format (e.g., +9647701234567 = 13 digits)
  // Convert to local 0xx format by removing +964 and adding 0
  if (digitsOnly.length === 13 && digitsOnly.startsWith('964')) {
    return '0' + digitsOnly.substring(3); // 9647701234567 -> 07701234567
  }
  
  // Handle 10-digit numbers missing leading 0 (e.g., 7701234567 -> 07701234567)
  if (digitsOnly.length === 10 && digitsOnly.startsWith('7')) {
    return '0' + digitsOnly;
  }
  
  return null;
}

function hasValidPhone(record) {
  // Try direct cleaning first
  const phone = record.phone || record.telephone || record.mobile || record.contact;
  if (cleanPhone(phone)) return true;
  
  // Try normalization for international formats
  if (normalizeIraqiPhone(phone)) return true;
  
  return false;
}

function getNormalizedPhone(record) {
  const phone = record.phone || record.telephone || record.mobile || record.contact;
  
  // Try direct cleaning
  const cleaned = cleanPhone(phone);
  if (cleaned) return cleaned;
  
  // Try normalization
  const normalized = normalizeIraqiPhone(phone);
  if (normalized) return normalized;
  
  return null;
}

function isRealBusiness(record) {
  // Must have phone
  if (!hasValidPhone(record)) return false;
  
  // Must have name
  const name = record.business_name || record.name || record.title;
  if (!name || name.length < 2 || name.toLowerCase() === 'unknown') return false;
  
  return true;
}

function mapStatus(status, hasPhone) {
  const lower = (status || '').toLowerCase();
  if (lower.includes('verif') || lower.includes('valid')) return 'verified';
  if (lower.includes('approv')) return 'approved';
  if (lower.includes('reject')) return 'rejected';
  // Auto-validate if has phone + name
  if (hasPhone) return 'verified';
  if (lower.includes('pend')) return 'pending';
  return 'needs_review';
}

// ── SYNC FUNCTIONS ──────────────────────────────────────────────────────────

async function getScraperCount() {
  const { count, error } = await scraperDB
    .from('iraqi_businesses')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Error counting scraper records:', error.message);
    return 0;
  }
  return count || 0;
}

async function getProductionCount() {
  const { count, error } = await prodDB
    .from('businesses')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Error counting production records:', error.message);
    return 0;
  }
  return count || 0;
}

async function fetchScraperRecords(batchSize = 1000, offset = 0) {
  const { data, error } = await scraperDB
    .from('iraqi_businesses')
    .select('*')
    .range(offset, offset + batchSize - 1);
  
  if (error) {
    console.error('❌ Error fetching scraper records:', error.message);
    return [];
  }
  return data || [];
}

async function syncToProduction(records, options = {}) {
  const { dryRun = false } = options;
  
  // Transform all records
  const transformed = records.map(transformRecord);
  
  // Filter only REAL businesses (with phone + name)
  const realBusinesses = transformed.filter(r => r._is_real);
  const fakeBusinesses = transformed.filter(r => !r._is_real);
  
  if (dryRun) {
    return {
      real: realBusinesses.length,
      fake: fakeBusinesses.length,
      synced: 0,
    };
  }
  
  // Only sync real businesses to production
  if (realBusinesses.length === 0) {
    return { real: 0, fake: fakeBusinesses.length, synced: 0 };
  }
  
  // Remove internal tracking fields before inserting
  const cleanRecords = realBusinesses.map(r => {
    const { _is_real, _phone_digits, ...clean } = r;
    return clean;
  });
  
  const { data, error } = await prodDB
    .from('businesses')
    .upsert(cleanRecords, { 
      onConflict: 'business_name,address,city',
      ignoreDuplicates: false 
    });
  
  if (error) {
    console.error('❌ Error syncing to production:', error.message);
    return { real: realBusinesses.length, fake: fakeBusinesses.length, synced: 0, error };
  }
  
  return { 
    real: realBusinesses.length, 
    fake: fakeBusinesses.length, 
    synced: cleanRecords.length 
  };
}

// ── MAIN ────────────────────────────────────────────────────────────────────

async function runSync(options = {}) {
  const { 
    dryRun = false, 
    reset = false,
    batchSize = 500,
    maxRecords = null 
  } = options;
  
  console.log('🚀 IRAQI BUSINESSES SYNC PIPELINE\n');
  console.log(`📊 Scraper DB: ${SCRAPER_URL}`);
  console.log(`🎯 Production DB: ${PROD_URL}`);
  console.log('');
  
  // Reset production if requested
  if (reset && !dryRun) {
    const confirmed = await truncateProduction();
    if (!confirmed) {
      console.error('❌ Reset failed, aborting sync');
      return;
    }
  } else if (reset && dryRun) {
    console.log('🏃 DRY RUN: Would truncate production table');
  }
  
  // Get counts
  console.log('📊 Getting record counts...');
  const scraperCount = await getScraperCount();
  const prodCount = await getProductionCount();
  
  console.log(`   Scraper (iraqi_businesses): ${scraperCount} records`);
  console.log(`   Production (businesses): ${prodCount} records`);
  console.log(`   To sync: ${scraperCount - prodCount} records`);
  console.log('');
  
  if (dryRun) {
    console.log('🏃 DRY RUN - No changes will be made');
    console.log('   Run with --sync to actually sync records');
    console.log('');
    
    // Show validation breakdown
    console.log('📋 VALIDATION PREVIEW:');
    console.log('   ✓ Real businesses (11-digit phone + name) → Will be synced');
    console.log('   ✗ Invalid (no valid 11-digit phone/name) → Kept in scraper only');
    console.log('');
  }
  
  if (scraperCount === 0) {
    console.log('⚠️  No records to sync');
    return;
  }
  
  // Sync in batches
  let totalReal = 0;
  let totalFake = 0;
  let totalSynced = 0;
  let failed = 0;
  const limit = maxRecords || scraperCount;
  
  console.log(`\n📤 Processing up to ${limit} records in batches of ${batchSize}...\n`);
  
  for (let offset = 0; offset < limit; offset += batchSize) {
    const batch = await fetchScraperRecords(batchSize, offset);
    
    if (batch.length === 0) break;
    
    try {
      const result = await syncToProduction(batch, { dryRun });
      totalReal += result.real;
      totalFake += result.fake;
      totalSynced += result.synced;
      
      if (dryRun) {
        console.log(`   📊 Batch ${Math.floor(offset / batchSize) + 1}: ${result.real} real ✓ | ${result.fake} invalid ✗`);
      } else {
        console.log(`   ✅ Batch ${Math.floor(offset / batchSize) + 1}: ${result.synced} synced to production`);
      }
    } catch (err) {
      failed += batch.length;
      console.error(`   ❌ Batch ${Math.floor(offset / batchSize) + 1} failed:`, err.message);
    }
  }
  
  console.log('\n📈 PROCESSING COMPLETE');
  console.log(`   ✓ Real businesses (11-digit phone): ${totalReal}`);
  console.log(`   ✗ Invalid (no valid 11-digit phone/name): ${totalFake}`);
  if (!dryRun) {
    console.log(`   ✅ Synced to production: ${totalSynced}`);
  }
  console.log(`   ❌ Failed: ${failed}`);
  
  // Final count
  const newProdCount = await getProductionCount();
  console.log(`   📁 Production total: ${newProdCount} records`);
  
  if (dryRun) {
    console.log('');
    console.log('🏃 This was a DRY RUN. Use --sync to actually push real businesses.');
  }
}

// ── RESET FUNCTION ───────────────────────────────────────────────────────────

async function truncateProduction() {
  console.log('⚠️  TRUNCATING production businesses table...');
  const { error } = await prodDB
    .from('businesses')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
  
  if (error) {
    console.error('❌ Error truncating production:', error.message);
    return false;
  }
  
  const { count } = await prodDB
    .from('businesses')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✅ Production table cleared. Current count: ${count || 0}`);
  return true;
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const options = {
  dryRun: !args.includes('--sync'),
  reset: args.includes('--reset'),
  batchSize: parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1]) || 500,
  maxRecords: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || null,
};

if (args.includes('--help')) {
  console.log(`
Usage: node sync-iraqi-businesses.mjs [options]

Description:
  Sync validated (real) businesses from scraper DB to production DB.
  Only businesses with valid phone numbers and names are synced.
  All records remain in scraper DB but are marked as real/invalid.

Options:
  --sync          Actually sync records (default: dry run)
  --batch=N       Batch size (default: 500)
  --limit=N       Max records to sync (default: all)
  --reset         Truncate production table before sync (DANGER: deletes all)
  --help          Show this help

Validation Rules (for a business to be "real"):
  ✓ Must have valid phone number (EXACTLY 11 digits after normalization)
  ✓ Must have business name (2+ characters, not 'unknown')
  ✗ Records without phone/name stay in scraper only

Phone Normalization:
  - Strips spaces, dashes, +, parentheses, and all non-digits
  - "0770 123 4567" -> "07701234567" (valid)
  - "+9647701234567" -> "07701234567" (normalized from international)
  - "7701234567" -> "07701234567" (added leading 0)
  - Must result in exactly 11 digits to pass

Examples:
  # Dry run (preview which records are real vs invalid)
  node sync-iraqi-businesses.mjs

  # Actually sync real businesses only
  node sync-iraqi-businesses.mjs --sync

  # Sync first 1000 records only
  node sync-iraqi-businesses.mjs --sync --limit=1000

  # Reset production and full sync
  node sync-iraqi-businesses.mjs --reset --sync
`);
  process.exit(0);
}

runSync(options).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
