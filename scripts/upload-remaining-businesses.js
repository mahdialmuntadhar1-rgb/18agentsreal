#!/usr/bin/env node
/**
 * Fix Duplicate IDs and Upload Remaining Businesses
 * Removes duplicates and uploads the remaining 452 businesses
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials
const SUPABASE_URL = 'https://hsadukhmcclwixuntqwu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWR1a2htY2Nsd2l4dW50cXd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA4MzM2OCwiZXhwIjoyMDg4NjU5MzY4fQ.2YpuPKrlv4jQNG-5dDlnzWzFqjqRbO_bxXksWh4PRZY';

// Input file
const INPUT_FILE = 'C:/Users/HB LAPTOP STORE/Documents/FOR-CLEANING-ALL/analysis_output/verification_output/01_verified_HIGH_confidence.csv';
const BATCH_SIZE = 100;

// Statistics
const stats = {
  totalRead: 0,
  duplicatesRemoved: 0,
  uniqueBusinesses: 0,
  uploaded: 0,
  failed: 0,
  skipped: 0,
  existingInDB: 0
};

// Read CSV
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

// Map CSV row to business schema
function mapToBusiness(row) {
  // Normalize phone number
  let phone = row['Phone 1'] || '';
  const phoneClean = phone.replace(/\D/g, '');
  
  // Ensure Iraqi format 07X XXX XXX XX
  let normalizedPhone = phoneClean;
  if (phoneClean.length === 10 && phoneClean.startsWith('7')) {
    normalizedPhone = '0' + phoneClean;
  }
  
  return {
    id: row['ID'] || null,
    name: row['Business Name'] || null,
    category: row['Category'] || 'Other',
    governorate: row['Governorate'] || null,
    city: row['City'] || null,
    phone: normalizedPhone || null,
    rating: parseFloat(row['Rating']) || 0
  };
}

// Main function
async function main() {
  console.log('='.repeat(70));
  console.log('🔧 FIX DUPLICATES & UPLOAD REMAINING BUSINESSES');
  console.log('='.repeat(70));
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Input: ${INPUT_FILE}\n`);

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Check current database state
  console.log('Checking current database...');
  try {
    const { data: currentData, error: currentError } = await supabase
      .from('businesses')
      .select('count', { count: 'exact', head: true });
    
    if (currentError) {
      console.log('⚠️  Could not check current count, continuing anyway...');
      stats.existingInDB = 0;
    } else {
      stats.existingInDB = currentData?.count || 0;
      console.log(`✓ Current database has ${stats.existingInDB} businesses`);
    }
  } catch (err) {
    console.log('⚠️  Database check failed, continuing anyway...');
    stats.existingInDB = 0;
  }
  console.log('');

  // Read CSV
  console.log('Reading CSV file...');
  const rows = await readCSV(INPUT_FILE);
  stats.totalRead = rows.length;
  console.log(`✓ ${rows.length} businesses loaded\n`);

  // Remove duplicates by ID
  console.log('Removing duplicate IDs...');
  const uniqueRows = [];
  const seenIds = new Set();
  
  for (const row of rows) {
    const id = row['ID'];
    if (!seenIds.has(id)) {
      seenIds.add(id);
      uniqueRows.push(row);
    } else {
      stats.duplicatesRemoved++;
    }
  }
  
  stats.uniqueBusinesses = uniqueRows.length;
  console.log(`✓ Removed ${stats.duplicatesRemoved} duplicates`);
  console.log(`✓ ${stats.uniqueBusinesses} unique businesses remain\n`);

  // Check which ones are already in database
  console.log('Checking which businesses are already uploaded...');
  const existingIds = new Set();
  const batchSize = 100;
  
  for (let i = 0; i < seenIds.size; i += batchSize) {
    const idsToCheck = Array.from(seenIds).slice(i, i + batchSize);
    const { data: existingData, error: existingError } = await supabase
      .from('businesses')
      .select('id')
      .in('id', idsToCheck);
    
    if (!existingError && existingData) {
      existingData.forEach(row => existingIds.add(row.id));
    }
  }
  
  console.log(`✓ ${existingIds.size} businesses already in database`);
  
  // Filter out businesses that need to be uploaded
  const toUpload = uniqueRows.filter(row => !existingIds.has(row['ID']));
  console.log(`✓ ${toUpload.length} businesses need to be uploaded\n`);

  if (toUpload.length === 0) {
    console.log('✅ All businesses are already uploaded!');
    return;
  }

  // Upload remaining businesses
  console.log(`Starting upload of ${toUpload.length} remaining businesses...\n`);

  // Process in batches
  const batches = [];
  for (let i = 0; i < toUpload.length; i += BATCH_SIZE) {
    batches.push(toUpload.slice(i, i + BATCH_SIZE));
  }

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const mapped = batch.map(mapToBusiness);
    
    // Filter out invalid entries
    const valid = mapped.filter(b => b.name && b.phone);
    stats.skipped += mapped.length - valid.length;

    if (valid.length === 0) {
      console.log(`  Batch ${batchIndex + 1}/${batches.length}: No valid entries, skipped`);
      continue;
    }

    // Insert batch
    const { data, error } = await supabase
      .from('businesses')
      .insert(valid)
      .select('id');

    if (error) {
      console.error(`  ❌ Batch ${batchIndex + 1} failed:`, error.message);
      stats.failed += valid.length;
    } else {
      stats.uploaded += valid.length;
      console.log(`  ✓ Batch ${batchIndex + 1}/${batches.length}: ${valid.length} uploaded`);
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL UPLOAD SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Read from CSV:      ${stats.totalRead}`);
  console.log(`Duplicates Removed:       ${stats.duplicatesRemoved}`);
  console.log(`Unique Businesses:        ${stats.uniqueBusinesses}`);
  console.log(`Already in Database:      ${existingIds.size}`);
  console.log(`Attempted to Upload:      ${toUpload.length}`);
  console.log(`Successfully Uploaded:    ${stats.uploaded}`);
  console.log(`Failed:                   ${stats.failed}`);
  console.log(`Skipped:                  ${stats.skipped}`);

  // Verify final count
  const { data: finalCount } = await supabase
    .from('businesses')
    .select('count', { count: 'exact', head: true });

  console.log(`\n📊 Database totals:`);
  console.log(`  Before this run: ${stats.existingInDB} businesses`);
  console.log(`  After this run:  ${finalCount?.count || 0} businesses`);
  console.log(`  Net added:      ${stats.uploaded} new businesses`);

  if (stats.failed === 0) {
    console.log('\n✅ ALL REMAINING BUSINESSES UPLOADED SUCCESSFULLY!');
  } else {
    console.log('\n⚠️  Some uploads failed. Check errors above.');
  }

  console.log(`\n🎯 RESULT: Your database now has ${finalCount?.count || 0} HIGH CONFIDENCE businesses!`);
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
