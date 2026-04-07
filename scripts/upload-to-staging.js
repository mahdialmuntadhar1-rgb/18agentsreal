#!/usr/bin/env node
/**
 * Upload launch-ready businesses to Supabase staging
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';

dotenv.config();

// STAGING Supabase credentials (from user)
const SUPABASE_URL = 'https://ujdsxzvvgaugypwtugdl.supabase.co';
const SUPABASE_KEY = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.error('Please set STAGING_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_FILE = './data/output/launch_ready_businesses.csv';
const TABLE_NAME = 'businesses_staging';

// SQL to create table
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id TEXT,
  business_name TEXT,
  arabic_name TEXT,
  english_name TEXT,
  category TEXT,
  subcategory TEXT,
  governorate TEXT,
  city TEXT,
  neighborhood TEXT,
  phone_1 TEXT,
  phone_2 TEXT,
  whatsapp TEXT,
  email_1 TEXT,
  website TEXT,
  facebook TEXT,
  instagram TEXT,
  tiktok TEXT,
  telegram TEXT,
  opening_hours TEXT,
  status TEXT,
  rating TEXT,
  verification TEXT,
  confidence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function ensureTable() {
  console.log('📊 Checking table...\n');
  
  // Try to select from table to see if it exists
  const { error: checkError } = await supabase
    .from(TABLE_NAME)
    .select('id')
    .limit(1);
  
  if (checkError && checkError.code === '42P01') {
    console.log('⚠️  Table does not exist.');
    console.log('\n📋 Please run this SQL in Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(CREATE_TABLE_SQL);
    console.log('='.repeat(60));
    console.log('\n👆 Copy the SQL above, paste into:');
    console.log('   https://ujdsxzvvgaugypwtugdl.supabase.co/project/sql');
    console.log('\nThen re-run this script.\n');
    return false;
  }
  
  if (checkError) {
    console.error('❌ Error checking table:', checkError.message);
    return false;
  }
  
  console.log('✅ Table exists\n');
  return true;
}
  
  console.log('✅ Table ready\n');
  return true;
}

async function uploadData() {
  console.log('📤 Uploading data from CSV...\n');
  
  const rows = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(csvParser())
      .on('data', (row) => {
        // Map CSV headers to table columns
        rows.push({
          id: row['ID'] || null,
          business_name: row['Business Name'] || null,
          arabic_name: row['Arabic Name'] || null,
          english_name: row['English Name'] || null,
          category: row['Category'] || null,
          subcategory: row['Subcategory'] || null,
          governorate: row['Governorate'] || null,
          city: row['City'] || null,
          neighborhood: row['Neighborhood'] || null,
          phone_1: row['Phone 1'] || null,
          phone_2: row['Phone 2'] || null,
          whatsapp: row['WhatsApp'] || null,
          email_1: row['Email 1'] || null,
          website: row['Website'] || null,
          facebook: row['Facebook'] || null,
          instagram: row['Instagram'] || null,
          tiktok: row['TikTok'] || null,
          telegram: row['Telegram'] || null,
          opening_hours: row['Opening Hours'] || null,
          status: row['Status'] || null,
          rating: row['Rating'] || null,
          verification: row['Verification'] || null,
          confidence: row['Confidence'] || null
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`📋 Read ${rows.length} rows from CSV\n`);
  
  // Upload in batches of 500
  const BATCH_SIZE = 500;
  let uploaded = 0;
  let errors = [];
  
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .insert(batch);
    
    if (error) {
      errors.push({ batch: i, error: error.message });
      console.error(`❌ Batch ${i}-${i + batch.length} failed: ${error.message}`);
    } else {
      uploaded += batch.length;
      process.stdout.write(`\r✅ Uploaded: ${uploaded}/${rows.length}`);
    }
  }
  
  console.log('\n');
  
  if (errors.length > 0) {
    console.error(`\n⚠️  ${errors.length} batches failed`);
  }
  
  return { total: rows.length, uploaded, errors };
}

async function verifyData() {
  console.log('\n🔍 Verifying uploaded data...\n');
  
  // Total count
  const { count, error: countError } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('❌ Failed to get count:', countError.message);
    return null;
  }
  
  console.log(`📊 Total rows in database: ${count}\n`);
  
  // Sample 10 rows
  const { data: sample, error: sampleError } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .limit(10);
  
  if (sampleError) {
    console.error('❌ Failed to get sample:', sampleError.message);
  } else {
    console.log('📋 SAMPLE 10 ROWS:\n');
    sample.forEach((row, i) => {
      console.log(`${i + 1}. ${row.business_name}`);
      console.log(`   📍 ${row.governorate}${row.city ? ', ' + row.city : ''}`);
      console.log(`   📞 ${row.phone_1}`);
      console.log(`   🏷️  ${row.category || 'N/A'}`);
      console.log('');
    });
  }
  
  // Governorate distribution
  const { data: govDist, error: govError } = await supabase
    .from(TABLE_NAME)
    .select('governorate, count')
    .group('governorate');
  
  if (!govError && govDist) {
    console.log('\n📍 GOVERNORATE DISTRIBUTION:\n');
    govDist
      .sort((a, b) => b.count - a.count)
      .forEach(g => console.log(`   ${g.governorate}: ${g.count}`));
  }
  
  // Category distribution
  const { data: catDist, error: catError } = await supabase
    .from(TABLE_NAME)
    .select('category, count')
    .group('category');
  
  if (!catError && catDist) {
    console.log('\n🏷️  CATEGORY DISTRIBUTION:\n');
    catDist
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach(c => console.log(`   ${c.category}: ${c.count}`));
  }
  
  return { count, sample, govDist, catDist };
}

async function main() {
  console.log('🚀 SUPABASE STAGING UPLOAD\n');
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`Table: ${TABLE_NAME}\n`);
  
  // Check CSV exists
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ CSV file not found: ${CSV_FILE}`);
    process.exit(1);
  }
  
  // Create table
  const tableReady = await createTable();
  if (!tableReady) {
    console.log('\n⚠️  Please create the table manually using the SQL above');
    console.log('Then re-run this script.\n');
    process.exit(1);
  }
  
  // Upload data
  const result = await uploadData();
  
  // Verify
  const verification = await verifyData();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total CSV rows: ${result.total}`);
  console.log(`Successfully uploaded: ${result.uploaded}`);
  console.log(`Failed batches: ${result.errors.length}`);
  console.log(`Database total: ${verification?.count || 'N/A'}`);
  console.log('='.repeat(60));
  
  if (result.uploaded > 0) {
    console.log('\n✅ Data is ready for frontend connection!');
    console.log(`\nNext step: Configure frontend to use ${TABLE_NAME}`);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
