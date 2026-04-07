#!/usr/bin/env node
/**
 * Check Categories in Database
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hsadukhmcclwixuntqwu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWR1a2htY2Nsd2l4dW50cXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODMzNjgsImV4cCI6MjA4ODY1OTM2OH0.XWDbzIPZNPk6j1GXixcIJKUb4lp48ipC7jExG2Q09Ns';

async function main() {
  console.log('='.repeat(70));
  console.log('📋 CHECKING DATABASE CATEGORIES');
  console.log('='.repeat(70));

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Get unique categories
    const { data: categories, error: catError } = await supabase
      .from('businesses')
      .select('category')
      .not('category', 'is', null);

    if (catError) {
      console.error('❌ Error getting categories:', catError.message);
      return;
    }

    const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])];
    
    console.log(`\n✓ Found ${uniqueCategories.length} unique categories:`);
    uniqueCategories.sort().forEach((cat, i) => {
      const count = categories?.filter(c => c.category === cat).length || 0;
      console.log(`  ${i + 1}. ${cat} (${count} businesses)`);
    });

    // Get unique governorates
    const { data: governorates, error: govError } = await supabase
      .from('businesses')
      .select('governorate')
      .not('governorate', 'is', null);

    if (!govError && governorates) {
      const uniqueGovernorates = [...new Set(governorates?.map(g => g.governorate) || [])];
      console.log(`\n✓ Found ${uniqueGovernorates.length} governorates:`);
      uniqueGovernorates.sort().forEach((gov, i) => {
        const count = governorates?.filter(g => g.governorate === gov).length || 0;
        console.log(`  ${i + 1}. ${gov} (${count} businesses)`);
      });
    }

    // Get sample data to verify structure
    const { data: sample, error: sampleError } = await supabase
      .from('businesses')
      .select('*')
      .limit(3);

    if (!sampleError && sample) {
      console.log('\n📋 Sample data structure:');
      console.log('  Fields available:', Object.keys(sample[0] || {}));
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
