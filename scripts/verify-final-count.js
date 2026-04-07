#!/usr/bin/env node
/**
 * Verify Final Database Count
 */

import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = 'https://hsadukhmcclwixuntqwu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWR1a2htY2Nsd2l4dW50cXd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA4MzM2OCwiZXhwIjoyMDg4NjU5MzY4fQ.2YpuPKrlv4jQNG-5dDlnzWzFqjqRbO_bxXksWh4PRZY';

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 VERIFYING FINAL DATABASE COUNT');
  console.log('='.repeat(70));
  console.log(`URL: ${SUPABASE_URL}\n`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Get total count
    const { data: countData, error: countError } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error getting count:', countError.message);
      return;
    }

    const totalCount = countData?.count || 0;
    console.log(`✓ Total businesses in database: ${totalCount}`);

    // Get sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('businesses')
      .select('name, city, phone, category')
      .limit(5);

    if (!sampleError && sampleData) {
      console.log('\n📋 Sample businesses:');
      sampleData.forEach((biz, i) => {
        console.log(`  ${i + 1}. ${biz.name} - ${biz.city} (${biz.phone})`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log(`🎯 FINAL RESULT: ${totalCount} HIGH CONFIDENCE BUSINESSES UPLOADED!`);
    console.log('='.repeat(70));

    console.log('\n📌 UPDATE YOUR FRONTEND:');
    console.log(`VITE_SUPABASE_URL=https://hsadukhmcclwixuntqwu.supabase.co`);
    console.log(`VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWR1a2htY2Nsd2l4dW50cXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODMzNjgsImV4cCI6MjA4ODY1OTM2OH0.XWDbzIPZNPk6j1GXixcIJKUb4lp48ipC7jExG2Q09Ns`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
