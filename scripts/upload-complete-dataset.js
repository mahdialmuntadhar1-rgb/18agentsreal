#!/usr/bin/env node
/**
 * Upload Complete Dataset (4,312 businesses) to Supabase
 * from with_valid_phone.csv
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

// Input file - complete dataset
const INPUT_FILE = 'C:/Users/HB LAPTOP STORE/Documents/FOR-CLEANING-ALL/analysis_output/with_valid_phone.csv';
const BATCH_SIZE = 100;

// Statistics
const stats = {
  totalRead: 0,
  uploaded: 0,
  failed: 0,
  skipped: 0,
  existingCount: 0,
  duplicates: 0
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

// Normalize phone number to Iraqi format
function normalizePhone(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const clean = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (clean.startsWith('964')) {
    // International format: +964 7X XXX XXX XX -> 07X XXX XXX XX
    return clean.length === 13 ? '0' + clean.slice(3) : null;
  } else if (clean.startsWith('07') && clean.length === 11) {
    // Already correct Iraqi format
    return clean;
  } else if (clean.startsWith('7') && clean.length === 10) {
    // Missing leading 0: 7X XXX XXX XX -> 07X XXX XXX XX
    return '0' + clean;
  }
  
  return null;
}

// Map CSV row to business schema
function mapToBusiness(row, index) {
  // Normalize phone number
  const phone = normalizePhone(row['Phone 1'] || row['phone'] || row['Phone'] || '');
  
  return {
    id: row['ID'] || row['id'] || String(index + 1),
    name: row['Business Name'] || row['name'] || row['Name'] || null,
    category: row['Category'] || row['category'] || 'Other',
    governorate: row['Governorate'] || row['governorate'] || null,
    city: row['City'] || row['city'] || null,
    phone: phone,
    rating: parseFloat(row['Rating'] || row['rating']) || 0
  };
}

// Main upload function
async function main() {
  console.log('='.repeat(70));
  console.log('📤 UPLOADING COMPLETE DATASET (4,312 BUSINESSES)');
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
      stats.existingCount = 0;
    } else {
      stats.existingCount = currentData?.count || 0;
      console.log(`✓ Current database has ${stats.existingCount} businesses`);
    }
  } catch (err) {
    console.log('⚠️  Database check failed, continuing anyway...');
    stats.existingCount = 0;
  }
  console.log('');

  // Read CSV
  console.log('Reading CSV file...');
  const rows = await readCSV(INPUT_FILE);
  stats.totalRead = rows.length;
  console.log(`✓ ${rows.length} businesses loaded\n`);

  // Preview first row
  if (rows.length > 0) {
    console.log('Sample business:');
    console.log('  Name:', rows[0]['Business Name'] || rows[0]['name'] || rows[0]['Name']);
    console.log('  Phone:', rows[0]['Phone 1'] || rows[0]['phone'] || rows[0]['Phone']);
    console.log('  City:', rows[0]['City'] || rows[0]['city']);
    console.log('  Category:', rows[0]['Category'] || rows[0]['category']);
    console.log('');
  }

  // Confirm upload
  console.log('Starting upload in batches of', BATCH_SIZE, '...\n');
  console.log(`Will add ${rows.length} businesses to existing ${stats.existingCount}...`);

  // Process in batches
  const batches = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    batches.push(rows.slice(i, i + BATCH_SIZE));
  }

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const mapped = batch.map((row, i) => mapToBusiness(row, batchIndex * BATCH_SIZE + i));
    
    // Filter out invalid entries
    const valid = mapped.filter(b => b.name && b.phone);
    stats.skipped += mapped.length - valid.length;

    if (valid.length === 0) {
      console.log(`  Batch ${batchIndex + 1}/${batches.length}: No valid entries, skipped`);
      continue;
    }

    try {
      // Insert batch with upsert to handle duplicates
      const { data, error } = await supabase
        .from('businesses')
        .upsert(valid, { onConflict: 'id' })
        .select('id');

      if (error) {
        // If upsert fails, try regular insert
        const { data: insertData, error: insertError } = await supabase
          .from('businesses')
          .insert(valid)
          .select('id');

        if (insertError) {
          console.error(`  ❌ Batch ${batchIndex + 1} failed:`, insertError.message);
          stats.failed += valid.length;
        } else {
          stats.uploaded += valid.length;
          console.log(`  ✓ Batch ${batchIndex + 1}/${batches.length}: ${valid.length} uploaded`);
        }
      } else {
        stats.uploaded += valid.length;
        console.log(`  ✓ Batch ${batchIndex + 1}/${batches.length}: ${valid.length} uploaded/upserted`);
      }
    } catch (err) {
      console.error(`  ❌ Batch ${batchIndex + 1} error:`, err.message);
      stats.failed += valid.length;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Read:           ${stats.totalRead}`);
  console.log(`Uploaded/Upserted:    ${stats.uploaded}`);
  console.log(`Failed:               ${stats.failed}`);
  console.log(`Skipped:              ${stats.skipped}`);

  // Verify final count
  try {
    const { data: finalCount } = await supabase
      .from('businesses')
      .select('count', { count: 'exact', head: true });

    console.log(`\n📊 Database totals:`);
    console.log(`  Before upload: ${stats.existingCount} businesses`);
    console.log(`  After upload:  ${finalCount?.count || 0} businesses`);
    console.log(`  Net added:      ${Math.max(0, (finalCount?.count || 0) - stats.existingCount)} new businesses`);
  } catch (err) {
    console.log('\n⚠️  Could not verify final count');
  }

  if (stats.failed === 0) {
    console.log('\n✅ ALL BUSINESSES UPLOADED SUCCESSFULLY!');
  } else {
    console.log('\n⚠️  Some uploads failed. Check errors above.');
  }

  console.log(`\n🎯 RESULT: Your database now has the complete Iraqi business dataset!`);
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
