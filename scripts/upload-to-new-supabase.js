#!/usr/bin/env node
/**
 * Upload Verified Businesses to NEW Supabase Database
 * hsadukhmcclwixuntqwu.supabase.co
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NEW Supabase credentials
const SUPABASE_URL = 'https://hsadukhmcclwixuntqwu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWR1a2htY2Nsd2l4dW50cXd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA4MzM2OCwiZXhwIjoyMDg4NjU5MzY4fQ.2YpuPKrlv4jQNG-5dDlnzWzFqjqRbO_bxXksWh4PRZY';

// Input file - HIGH confidence businesses
const INPUT_FILE = 'C:/Users/HB LAPTOP STORE/Documents/FOR-CLEANING-ALL/analysis_output/verification_output/01_verified_HIGH_confidence.csv';
const BATCH_SIZE = 100;

// Statistics
const stats = {
  totalRead: 0,
  uploaded: 0,
  failed: 0,
  skipped: 0,
  existingCount: 0
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

// Main upload function
async function main() {
  console.log('='.repeat(70));
  console.log('📤 UPLOADING TO NEW SUPABASE DATABASE');
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

  // Test connection and check existing data
  console.log('Testing connection...');
  const { data: existingData, error: testError } = await supabase
    .from('businesses')
    .select('count', { count: 'exact', head: true });
  
  if (testError) {
    console.error('❌ Connection failed:', testError.message);
    
    // Check if table exists
    if (testError.code === '42P01') {
      console.log('\n⚠️  Table "businesses" does not exist.');
      console.log('Creating table with schema...\n');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.businesses (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          category text DEFAULT 'Other',
          governorate text,
          city text,
          phone text,
          rating numeric(3,2) DEFAULT 0,
          website text,
          facebook text,
          instagram text,
          email text,
          image_url text,
          confidence_score integer DEFAULT 0,
          validation_status text DEFAULT 'pending',
          source_file text,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        );

        -- Enable RLS
        ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

        -- Allow public read access
        CREATE POLICY "Allow public read" ON public.businesses
          FOR SELECT USING (true);

        -- Allow service role full access
        CREATE POLICY "Allow service role full access" ON public.businesses
          FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_businesses_phone ON public.businesses(phone);
        CREATE INDEX IF NOT EXISTS idx_businesses_city ON public.businesses(city);
        CREATE INDEX IF NOT EXISTS idx_businesses_governorate ON public.businesses(governorate);
        CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
      `;
      
      console.log('Please run this SQL in Supabase SQL Editor:');
      console.log(createTableSQL);
      console.log('\nOr go to: https://supabase.com/dashboard/project/hsadukhmcclwixuntqwu/sql');
      console.log('\nAfter creating the table, run this script again.');
      return;
    }
    
    throw testError;
  }

  stats.existingCount = existingData?.count || 0;
  console.log('✓ Connected to Supabase');
  console.log(`Current business count: ${stats.existingCount}\n`);

  // Read CSV
  console.log('Reading CSV file...');
  const rows = await readCSV(INPUT_FILE);
  stats.totalRead = rows.length;
  console.log(`✓ ${rows.length} businesses loaded\n`);

  // Preview first row
  if (rows.length > 0) {
    console.log('Sample business:');
    console.log('  Name:', rows[0]['Business Name']);
    console.log('  Phone:', rows[0]['Phone 1']);
    console.log('  City:', rows[0]['City']);
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

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Read:           ${stats.totalRead}`);
  console.log(`Uploaded:             ${stats.uploaded}`);
  console.log(`Failed:               ${stats.failed}`);
  console.log(`Skipped:              ${stats.skipped}`);
  console.log(`Success Rate:          ${((stats.uploaded / stats.totalRead) * 100).toFixed(1)}%`);

  // Verify final count
  const { data: finalCount } = await supabase
    .from('businesses')
    .select('count', { count: 'exact', head: true });

  console.log(`\n📊 Database totals:`);
  console.log(`  Before upload: ${stats.existingCount} businesses`);
  console.log(`  After upload:  ${finalCount?.count || 0} businesses`);
  console.log(`  Net added:      ${stats.uploaded} new businesses`);

  if (stats.failed === 0) {
    console.log('\n✅ ALL BUSINESSES UPLOADED SUCCESSFULLY!');
  } else {
    console.log('\n⚠️  Some uploads failed. Check errors above.');
  }

  console.log('\n📌 NEXT STEPS:');
  console.log(`1. Your database now has ${finalCount?.count || 0} total businesses`);
  console.log('2. Update your frontend to use the new Supabase URL');
  console.log('3. Update environment variables:');
  console.log(`   VITE_SUPABASE_URL=https://hsadukhmcclwixuntqwu.supabase.co`);
  console.log(`   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWR1a2htY2Nsd2l4dW50cXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODMzNjgsImV4cCI6MjA4ODY1OTM2OH0.XWDbzIPZNPk6j1GXixcIJKUb4lp48ipC7jExG2Q09Ns`);
  
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
