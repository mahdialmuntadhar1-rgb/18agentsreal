#!/usr/bin/env node
/**
 * Upload Verified Businesses to Supabase
 * Loads HIGH confidence businesses to production database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials from user
const SUPABASE_URL = 'https://ujdsxzvvgaugypwtugdl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZHN4enZ2Z2F1Z3lwd3R1Z2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM3NDc2NiwiZXhwIjoyMDkwOTUwNzY2fQ.-t2egD15jUCt77X4IXG_ROksAj8xh4IDqt6A8l1lE_c';

// Input file - HIGH confidence businesses
const INPUT_FILE = 'C:/Users/HB LAPTOP STORE/Documents/FOR-CLEANING-ALL/analysis_output/verification_output/01_verified_HIGH_confidence.csv';
const BATCH_SIZE = 100;

// Statistics
const stats = {
  totalRead: 0,
  uploaded: 0,
  failed: 0,
  skipped: 0
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

// Map CSV row to Supabase business schema
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
    name: row['Business Name'] || null,
    category: row['Category'] || 'Other',
    governorate: row['Governorate'] || null,
    city: row['City'] || null,
    phone: normalizedPhone || null,
    rating: parseFloat(row['Rating']) || 0,
    website: row['Website'] || null,
    facebook: row['Facebook'] || null,
    instagram: row['Instagram'] || null,
    email: row['Email 1'] || null,
    image: row['Image'] || null,
    created_at: new Date().toISOString()
  };
}

// Main upload function
async function main() {
  console.log('='.repeat(70));
  console.log('📤 UPLOADING TO SUPABASE');
  console.log('='.repeat(70));
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Input: ${INPUT_FILE}\n`);

  // Initialize Supabase client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Test connection
  console.log('Testing Supabase connection...');
  const { data: testData, error: testError } = await supabase
    .from('businesses')
    .select('count', { count: 'exact', head: true });
  
  if (testError) {
    console.error('❌ Connection failed:', testError.message);
    
    // Check if table exists
    if (testError.code === '42P01') {
      console.log('\n⚠️  Table "businesses" does not exist.');
      console.log('Creating table...\n');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.businesses (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          name text NOT NULL,
          name_ar text,
          name_ku text,
          category text DEFAULT 'Other',
          governorate text,
          city text,
          address text,
          phone text,
          phone_2 text,
          rating numeric(3,2) DEFAULT 0,
          review_count integer DEFAULT 0,
          is_verified boolean DEFAULT false,
          is_featured boolean DEFAULT false,
          is_published boolean DEFAULT true,
          website text,
          facebook text,
          instagram text,
          whatsapp text,
          email text,
          image_url text,
          description text,
          description_ar text,
          opening_hours text,
          latitude numeric(10,8),
          longitude numeric(11,8),
          owner_id uuid,
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

        -- Create index on phone
        CREATE INDEX IF NOT EXISTS idx_businesses_phone ON public.businesses(phone);
        CREATE INDEX IF NOT EXISTS idx_businesses_city ON public.businesses(city);
        CREATE INDEX IF NOT EXISTS idx_businesses_governorate ON public.businesses(governorate);
        CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
      `;
      
      // Try to create via RPC or direct SQL
      console.log('Please run this SQL in Supabase SQL Editor:');
      console.log(createTableSQL);
      console.log('\nOr go to: https://supabase.com/dashboard/project/ujdsxzvvgaugypwtugdl/sql');
      
      return;
    }
    
    throw testError;
  }

  console.log('✓ Connected to Supabase');
  console.log(`Current business count: ${testData?.count || 0}\n`);

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
  console.log(`Total Read:    ${stats.totalRead}`);
  console.log(`Uploaded:      ${stats.uploaded}`);
  console.log(`Failed:        ${stats.failed}`);
  console.log(`Skipped:       ${stats.skipped}`);
  console.log(`Success Rate:  ${((stats.uploaded / stats.totalRead) * 100).toFixed(1)}%`);

  // Verify final count
  const { data: finalCount } = await supabase
    .from('businesses')
    .select('count', { count: 'exact', head: true });

  console.log(`\n📊 Database now has: ${finalCount?.count || 0} total businesses`);

  if (stats.failed === 0) {
    console.log('\n✅ ALL BUSINESSES UPLOADED SUCCESSFULLY!');
  } else {
    console.log('\n⚠️  Some uploads failed. Check errors above.');
  }

  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
