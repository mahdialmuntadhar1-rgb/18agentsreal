#!/usr/bin/env node
/**
 * Check actual business count with different method
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hsadukhmcclwixuntqwu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWR1a2htY2Nsd2l4dW50cXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODMzNjgsImV4cCI6MjA4ODY1OTM2OH0.XWDbzIPZNPk6j1GXixcIJKUb4lp48ipC7jExG2Q09Ns';

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 CHECKING ACTUAL BUSINESS COUNT');
  console.log('='.repeat(70));

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Method 1: Count all rows
    const { data: allData, error: allError } = await supabase
      .from('businesses')
      .select('id');

    if (!allError && allData) {
      console.log(`✓ Method 1 - All businesses: ${allData.length}`);
    }

    // Method 2: Count with head
    const { data: headData, error: headError } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true });

    if (!headError && headData) {
      console.log(`✓ Method 2 - Head count: ${headData.count || 0}`);
    }

    // Method 3: Get first 1000 to see if data exists
    const { data: sampleData, error: sampleError } = await supabase
      .from('businesses')
      .select('id, name, city')
      .limit(1000);

    if (!sampleError && sampleData) {
      console.log(`✓ Method 3 - Sample 1000: ${sampleData.length} businesses`);
      
      if (sampleData.length > 0) {
        console.log('\n📋 First 5 businesses:');
        sampleData.slice(0, 5).forEach((biz, i) => {
          console.log(`  ${i + 1}. ${biz.name} - ${biz.city} (ID: ${biz.id})`);
        });
      }
    }

    // Method 4: Count by category
    const { data: catData, error: catError } = await supabase
      .from('businesses')
      .select('category');

    if (!catError && catData) {
      console.log(`✓ Method 4 - Category count: ${catData.length} businesses`);
      
      const uniqueCategories = [...new Set(catData.map(c => c.category))];
      console.log(`  Categories: ${uniqueCategories.length}`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
