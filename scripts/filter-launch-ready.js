#!/usr/bin/env node
/**
 * Launch-Ready Filter
 * Creates MVP dataset from standardized master
 */

import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { format } from 'fast-csv';

const INPUT_FILE = './data/output/master_standardized_dataset.csv';
const OUTPUT_FILE = './data/output/launch_ready_businesses.csv';

// Valid Iraqi phone pattern: 07 followed by 9 digits
const VALID_PHONE_REGEX = /^07\d{9}$/;

function isValidPhone(phone) {
  return phone && VALID_PHONE_REGEX.test(phone.trim());
}

function isNotEmpty(value) {
  return value && value.trim().length > 0;
}

async function filterLaunchReady() {
  console.log('🚀 Creating launch-ready dataset...\n');
  
  const rows = [];
  let totalRows = 0;
  
  // Read master dataset
  await new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_FILE)
      .pipe(csvParser())
      .on('data', (row) => {
        totalRows++;
        
        // Filter criteria
        const hasBusinessName = isNotEmpty(row['Business Name']);
        const hasGovernorate = isNotEmpty(row['Governorate']);
        const hasValidPhone = isValidPhone(row['Phone 1']);
        
        if (hasBusinessName && hasGovernorate && hasValidPhone) {
          rows.push(row);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  // Write launch-ready CSV
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    const csvStream = format({ headers });
    const writeStream = fs.createWriteStream(OUTPUT_FILE);
    
    csvStream.pipe(writeStream);
    rows.forEach(row => csvStream.write(row));
    csvStream.end();
    
    await new Promise((resolve) => writeStream.on('finish', resolve));
  }
  
  // Report
  const percentage = ((rows.length / totalRows) * 100).toFixed(1);
  
  console.log('📊 LAUNCH-READY DATASET COMPLETE\n');
  console.log(`Total rows in master: ${totalRows.toLocaleString()}`);
  console.log(`Rows kept for launch: ${rows.length.toLocaleString()}`);
  console.log(`Usable data: ${percentage}%\n`);
  
  console.log(`📁 Output: ${OUTPUT_FILE}\n`);
  
  // Sample preview
  console.log('📋 SAMPLE (10 rows):\n');
  rows.slice(0, 10).forEach((row, i) => {
    console.log(`${i + 1}. ${row['Business Name']}`);
    console.log(`   📍 ${row['Governorate']}${row['City'] ? ', ' + row['City'] : ''}`);
    console.log(`   📞 ${row['Phone 1']}`);
    console.log(`   🏷️  ${row['Category'] || 'N/A'}`);
    console.log('');
  });
  
  console.log('✅ Ready for Supabase upload!');
}

filterLaunchReady().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
