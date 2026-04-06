/**
 * SUPABASE DATA AUDIT SCRIPT
 * 
 * This script audits the data flow from Supabase to the frontend
 * Run this in the browser console or as a standalone script
 */

import { createClient } from '@supabase/supabase-js';

// Initialize client with same credentials as app
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function auditDataFlow() {
  console.log('🔍 STARTING COMPREHENSIVE DATA AUDIT');
  console.log('=====================================');
  
  const auditReport = {
    timestamp: new Date().toISOString(),
    stages: {},
    issues: [],
    recommendations: []
  };

  // STAGE 1: Count total rows in database
  console.log('\n📊 STAGE 1: Database Row Counts');
  try {
    const { count: totalCount, error: countError } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    const { count: activeCount, error: activeError } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    if (activeError) throw activeError;
    
    auditReport.stages.database = {
      totalRows: totalCount,
      activeRows: activeCount,
      inactiveRows: totalCount - activeCount
    };
    
    console.log(`  ✅ Total rows in DB: ${totalCount}`);
    console.log(`  ✅ Active rows: ${activeCount}`);
    console.log(`  ⚠️  Inactive rows: ${totalCount - activeCount}`);
    
    if (totalCount > 100 && activeCount > 100) {
      auditReport.issues.push(`Database has ${activeCount} active rows, but frontend limits to 100`);
    }
  } catch (err) {
    console.error('  ❌ Failed to get count:', err);
    auditReport.stages.database = { error: String(err) };
  }

  // STAGE 2: Fetch with current frontend settings (limit: 100)
  console.log('\n📊 STAGE 2: Fetch with Frontend Settings (limit: 100)');
  try {
    const { data: limitedData, error: limitedError } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active')
      .order('confidence_score', { ascending: false })
      .limit(100);
    
    if (limitedError) throw limitedError;
    
    auditReport.stages.frontendFetch = {
      rowsFetched: limitedData?.length || 0,
      limitApplied: 100,
      firstRow: limitedData?.[0]?.business_name || 'N/A',
      lastRow: limitedData?.[limitedData.length - 1]?.business_name || 'N/A'
    };
    
    console.log(`  ⚠️  Rows fetched with limit(100): ${limitedData?.length || 0}`);
    console.log(`  🔍 First: ${limitedData?.[0]?.business_name}`);
    console.log(`  🔍 Last: ${limitedData?.[limitedData.length - 1]?.business_name}`);
    
    if (limitedData?.length === 100) {
      auditReport.issues.push('Hard limit of 100 rows applied - remaining rows not fetched');
      auditReport.recommendations.push('Remove limit: 100 or implement pagination');
    }
  } catch (err) {
    console.error('  ❌ Failed to fetch with limit:', err);
    auditReport.stages.frontendFetch = { error: String(err) };
  }

  // STAGE 3: Fetch ALL rows (no limit)
  console.log('\n📊 STAGE 3: Fetch All Rows (no limit)');
  try {
    const { data: allData, error: allError } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active')
      .order('confidence_score', { ascending: false });
    
    if (allError) throw allError;
    
    auditReport.stages.allRowsFetch = {
      totalRowsFetched: allData?.length || 0,
      differenceFromLimit: (allData?.length || 0) - 100
    };
    
    console.log(`  ✅ Total rows without limit: ${allData?.length || 0}`);
    console.log(`  ⚠️  Hidden by limit(100): ${(allData?.length || 0) - 100} rows`);
    
    // Check for data quality issues
    const withPhone = allData?.filter(r => r.phone_1).length || 0;
    const withImage = allData?.filter(r => r.image || r.logo).length || 0;
    const withArabicName = allData?.filter(r => r.arabic_name).length || 0;
    
    console.log(`  📞 With phone: ${withPhone}/${allData?.length}`);
    console.log(`  🖼️  With image/logo: ${withImage}/${allData?.length}`);
    console.log(`  📝 With Arabic name: ${withArabicName}/${allData?.length}`);
  } catch (err) {
    console.error('  ❌ Failed to fetch all:', err);
    auditReport.stages.allRowsFetch = { error: String(err) };
  }

  // STAGE 4: Check distinct categories
  console.log('\n📊 STAGE 4: Category Distribution');
  try {
    const { data: categories, error: catError } = await supabase
      .from('businesses')
      .select('category')
      .eq('status', 'active');
    
    if (catError) throw catError;
    
    const categoryCounts = {};
    categories?.forEach(row => {
      const cat = row.category || 'uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    auditReport.stages.categories = {
      distinctCategories: Object.keys(categoryCounts).length,
      distribution: categoryCounts
    };
    
    console.log(`  📁 Distinct categories: ${Object.keys(categoryCounts).length}`);
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`     ${cat}: ${count}`);
      });
  } catch (err) {
    console.error('  ❌ Failed to get categories:', err);
  }

  // STAGE 5: Check distinct governorates
  console.log('\n📊 STAGE 5: Governorate Distribution');
  try {
    const { data: governorates, error: govError } = await supabase
      .from('businesses')
      .select('governorate')
      .eq('status', 'active');
    
    if (govError) throw govError;
    
    const governorateCounts = {};
    governorates?.forEach(row => {
      const gov = row.governorate || 'unknown';
      governorateCounts[gov] = (governorateCounts[gov] || 0) + 1;
    });
    
    auditReport.stages.governorates = {
      distinctGovernorates: Object.keys(governorateCounts).length,
      distribution: governorateCounts
    };
    
    console.log(`  🗺️  Distinct governorates: ${Object.keys(governorateCounts).length}`);
    Object.entries(governorateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([gov, count]) => {
        console.log(`     ${gov}: ${count}`);
      });
  } catch (err) {
    console.error('  ❌ Failed to get governorates:', err);
  }

  // STAGE 6: Simulate enrichment process
  console.log('\n📊 STAGE 6: Enrichment Process Simulation');
  try {
    const { data: sampleData } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active')
      .limit(10);
    
    let droppedCount = 0;
    const issues = [];
    
    sampleData?.forEach((row, idx) => {
      // Check what enrichment would drop
      if (!row.business_name) {
        droppedCount++;
        issues.push(`Row ${idx}: Missing business_name`);
      }
      if (!row.confidence_score && row.confidence_score !== 0) {
        issues.push(`Row ${idx}: Missing confidence_score`);
      }
    });
    
    console.log(`  ✅ Sample of ${sampleData?.length || 0} rows processed`);
    console.log(`  ⚠️  Issues found in sample: ${issues.length}`);
    issues.slice(0, 5).forEach(issue => console.log(`     - ${issue}`));
    
    auditReport.stages.enrichment = {
      sampleSize: sampleData?.length || 0,
      issuesFound: issues.length,
      sampleIssues: issues.slice(0, 5)
    };
  } catch (err) {
    console.error('  ❌ Failed enrichment check:', err);
  }

  // STAGE 7: Check RLS
  console.log('\n📊 STAGE 7: Row Level Security Check');
  try {
    // Try to fetch as anon (current client)
    const { data: rlsTest, error: rlsError } = await supabase
      .from('businesses')
      .select('id')
      .eq('status', 'active')
      .limit(1);
    
    if (rlsError) {
      auditReport.stages.rls = { accessible: false, error: rlsError.message };
      console.log(`  ❌ RLS BLOCK: ${rlsError.message}`);
      auditReport.issues.push(`RLS Policy blocking access: ${rlsError.message}`);
    } else {
      auditReport.stages.rls = { accessible: true, canRead: rlsTest !== null };
      console.log(`  ✅ RLS allows access (read ${rlsTest?.length || 0} test rows)`);
    }
  } catch (err) {
    console.error('  ❌ RLS check failed:', err);
  }

  // FINAL REPORT
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                    AUDIT SUMMARY                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`Timestamp: ${auditReport.timestamp}`);
  console.log(`\n🚨 ISSUES FOUND: ${auditReport.issues.length}`);
  auditReport.issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
  
  console.log(`\n💡 RECOMMENDATIONS: ${auditReport.recommendations.length}`);
  auditReport.recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec}`);
  });
  
  console.log('\n📊 STAGE SUMMARY:');
  Object.entries(auditReport.stages).forEach(([stage, data]) => {
    console.log(`   ${stage}:`, JSON.stringify(data, null, 2).substring(0, 100) + '...');
  });
  
  console.log('\n✅ Audit complete!');
  
  // Return for programmatic use
  window.__AUDIT_REPORT__ = auditReport;
  return auditReport;
}

// Auto-run if imported directly
if (typeof window !== 'undefined') {
  window.auditDataFlow = auditDataFlow;
  console.log('✅ Audit function available as window.auditDataFlow()');
}

export default auditDataFlow;
