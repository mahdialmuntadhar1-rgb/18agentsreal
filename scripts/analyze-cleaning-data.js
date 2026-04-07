#!/usr/bin/env node
/**
 * Comprehensive Data Analysis for FOR-CLEANING-ALL
 * Analyzes all data files, counts duplicates, creates master sheets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import { format } from 'fast-csv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = 'C:/Users/HB LAPTOP STORE/Documents/FOR-CLEANING-ALL';
const OUTPUT_DIR = path.join(INPUT_DIR, 'analysis_output');

// Statistics tracking
const stats = {
  totalFiles: 0,
  totalRows: 0,
  validPhones: 0,
  invalidPhones: 0,
  noPhones: 0,
  duplicates: 0,
  withFullInfo: 0,
  filesProcessed: []
};

// Phone normalization function
function normalizePhone(phone) {
  if (!phone || phone === '' || phone === null || phone === undefined) {
    return { normalized: null, valid: false, type: 'missing' };
  }
  
  let original = String(phone).trim();
  
  // Extract all digit sequences
  const digitMatches = original.match(/\d+/g);
  if (!digitMatches) {
    return { normalized: null, valid: false, type: 'invalid', original };
  }
  
  let allDigits = digitMatches.join('');
  
  // Try to extract Iraqi phone numbers
  const iraqiPhoneRegex = /(?:964|00964|\+964)?0?7[3-9]\d{8}/g;
  const matches = allDigits.match(iraqiPhoneRegex);
  
  if (!matches || matches.length === 0) {
    // Try loose match
    const looseMatches = allDigits.match(/0?7\d{9}/g);
    if (looseMatches && looseMatches.length > 0) {
      const normalized = looseMatches.map(m => m.startsWith('0') ? m : '0' + m);
      return { 
        normalized: normalized[0], 
        valid: true, 
        type: 'valid',
        additional: normalized.slice(1),
        original 
      };
    }
    return { normalized: original, valid: false, type: 'invalid', original };
  }
  
  // Normalize each match
  const normalized = matches.map(match => {
    let digits = match;
    if (digits.startsWith('+964')) digits = digits.slice(4);
    else if (digits.startsWith('00964')) digits = digits.slice(5);
    else if (digits.startsWith('964')) digits = digits.slice(3);
    if (!digits.startsWith('0')) digits = '0' + digits;
    return digits;
  });
  
  const primary = normalized[0];
  const isValid = /^07\d{9}$/.test(primary);
  
  return {
    normalized: isValid ? primary : original,
    valid: isValid,
    type: isValid ? 'valid' : 'invalid',
    additional: isValid ? normalized.slice(1) : [],
    original
  };
}

// Generate deduplication key
function getDedupeKey(row) {
  const phone = row['Phone 1'] || row['phone'] || '';
  const name = (row['Business Name'] || row['name'] || row['business_name'] || '').toLowerCase().trim();
  const governorate = (row['Governorate'] || row['governorate'] || '').toLowerCase().trim();
  
  if (phone && phone.match(/^07\d{9}$/)) {
    return `phone:${phone}`;
  } else if (name && governorate) {
    return `name:${name}|gov:${governorate}`;
  }
  return null;
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read CSV file
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

// Read JSON file
function readJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  return Array.isArray(data) ? data : (data.businesses || data.data || []);
}

// Process a single file
async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  let rows = [];
  
  try {
    if (ext === '.csv') {
      rows = await readCSV(filePath);
    } else if (ext === '.json') {
      rows = readJSON(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
      console.log(`  ⚠️  Skipping XLSX (install xlsx package to support): ${fileName}`);
      return [];
    } else {
      return [];
    }
  } catch (err) {
    console.error(`  ❌ Error reading ${fileName}: ${err.message}`);
    return [];
  }
  
  const processed = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Detect fields from various possible column names
    const businessName = row['Business Name'] || row['business_name'] || row['name'] || row['title'] || row['Company'] || '';
    const phone1 = row['Phone 1'] || row['phone'] || row['mobile'] || row['telephone'] || row['Phone'] || '';
    const governorate = row['Governorate'] || row['governorate'] || row['province'] || row['state'] || '';
    const category = row['Category'] || row['category'] || row['type'] || '';
    
    // Normalize phone
    const phoneResult = normalizePhone(phone1);
    
    const processedRow = {
      'ID': row['ID'] || row['id'] || `${fileName}_${i}`,
      'Business Name': businessName,
      'Arabic Name': row['Arabic Name'] || row['arabic_name'] || row['nameAr'] || '',
      'English Name': row['English Name'] || row['english_name'] || '',
      'Category': category,
      'Subcategory': row['Subcategory'] || row['subcategory'] || '',
      'Governorate': governorate,
      'City': row['City'] || row['city'] || '',
      'Neighborhood': row['Neighborhood'] || row['neighborhood'] || row['address'] || '',
      'Phone 1': phoneResult.normalized || phone1,
      'Phone 2': row['Phone 2'] || row['phone_2'] || '',
      'WhatsApp': row['WhatsApp'] || row['whatsapp'] || '',
      'Email 1': row['Email 1'] || row['email'] || '',
      'Website': row['Website'] || row['website'] || '',
      'Facebook': row['Facebook'] || row['facebook'] || '',
      'Instagram': row['Instagram'] || row['instagram'] || '',
      'TikTok': row['TikTok'] || row['tiktok'] || '',
      'Telegram': row['Telegram'] || row['telegram'] || '',
      'Opening Hours': row['Opening Hours'] || row['opening_hours'] || '',
      'Status': row['Status'] || row['status'] || 'active',
      'Rating': row['Rating'] || row['rating'] || '',
      'Verification': row['Verification'] || row['verification'] || 'unverified',
      'Confidence': row['Confidence'] || row['confidence'] || '',
      '_source_file': fileName,
      '_phone_status': phoneResult.type,
      '_original_phone': phoneResult.original || phone1,
      '_dedupe_key': getDedupeKey({
        'Business Name': businessName,
        'Phone 1': phoneResult.normalized,
        'Governorate': governorate
      })
    };
    
    processed.push(processedRow);
  }
  
  stats.totalRows += processed.length;
  stats.filesProcessed.push({
    file: fileName,
    rows: processed.length
  });
  
  return processed;
}

// Main analysis function
async function main() {
  console.log('=' .repeat(70));
  console.log('🔍 COMPREHENSIVE DATA ANALYSIS');
  console.log('=' .repeat(70));
  console.log(`Input: ${INPUT_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);
  
  // Get all data files
  const files = fs.readdirSync(INPUT_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.csv', '.json', '.xlsx', '.xls'].includes(ext);
  });
  
  console.log(`Found ${files.length} data files\n`);
  stats.totalFiles = files.length;
  
  // Process all files
  const allRows = [];
  
  for (const file of files) {
    const filePath = path.join(INPUT_DIR, file);
    console.log(`Processing: ${file}`);
    const rows = await processFile(filePath);
    allRows.push(...rows);
    console.log(`  ✓ ${rows.length} rows`);
  }
  
  console.log(`\n📊 TOTAL ROWS PROCESSED: ${allRows.length}\n`);
  
  // Categorize rows
  const withValidPhone = [];
  const withoutPhone = [];
  const withInvalidPhone = [];
  const withFullInfo = [];
  const seenDedupeKeys = new Set();
  const duplicates = [];
  
  for (const row of allRows) {
    const hasBusinessName = row['Business Name'] && row['Business Name'].trim().length > 0;
    const hasGovernorate = row['Governorate'] && row['Governorate'].trim().length > 0;
    const phoneStatus = row['_phone_status'];
    const dedupeKey = row['_dedupe_key'];
    
    // Check for duplicates
    if (dedupeKey) {
      if (seenDedupeKeys.has(dedupeKey)) {
        stats.duplicates++;
        duplicates.push(row);
      } else {
        seenDedupeKeys.add(dedupeKey);
      }
    }
    
    // Categorize
    if (phoneStatus === 'valid') {
      withValidPhone.push(row);
      stats.validPhones++;
    } else if (phoneStatus === 'missing') {
      withoutPhone.push(row);
      stats.noPhones++;
    } else {
      withInvalidPhone.push(row);
      stats.invalidPhones++;
    }
    
    // Check for full info
    if (hasBusinessName && hasGovernorate && phoneStatus === 'valid') {
      withFullInfo.push(row);
      stats.withFullInfo++;
    }
  }
  
  console.log('\n📈 CATEGORIZATION RESULTS:');
  console.log(`  ✅ With valid phone: ${withValidPhone.length.toLocaleString()}`);
  console.log(`  ❌ Without phone: ${withoutPhone.length.toLocaleString()}`);
  console.log(`  ⚠️  Invalid phone: ${withInvalidPhone.length.toLocaleString()}`);
  console.log(`  📋 With full info: ${withFullInfo.length.toLocaleString()}`);
  console.log(`  🔁 Duplicates found: ${stats.duplicates.toLocaleString()}`);
  
  // Write output files
  const masterHeaders = [
    'ID', 'Business Name', 'Arabic Name', 'English Name', 'Category', 'Subcategory',
    'Governorate', 'City', 'Neighborhood', 'Phone 1', 'Phone 2', 'WhatsApp',
    'Email 1', 'Website', 'Facebook', 'Instagram', 'TikTok', 'Telegram',
    'Opening Hours', 'Status', 'Rating', 'Verification', 'Confidence',
    '_source_file', '_phone_status', '_original_phone'
  ];
  
  // Write master sheet (all businesses, excluding duplicates)
  const uniqueRows = allRows.filter(row => {
    if (!row['_dedupe_key']) return true;
    // Keep first occurrence
    const idx = allRows.findIndex(r => r['_dedupe_key'] === row['_dedupe_key']);
    return allRows[idx] === row;
  });
  
  await writeCSV(path.join(OUTPUT_DIR, 'master_all_businesses.csv'), uniqueRows, masterHeaders);
  await writeCSV(path.join(OUTPUT_DIR, 'with_valid_phone.csv'), withValidPhone, masterHeaders);
  await writeCSV(path.join(OUTPUT_DIR, 'without_phone.csv'), withoutPhone, masterHeaders);
  await writeCSV(path.join(OUTPUT_DIR, 'with_invalid_phone.csv'), withInvalidPhone, masterHeaders);
  await writeCSV(path.join(OUTPUT_DIR, 'with_full_info.csv'), withFullInfo, masterHeaders);
  await writeCSV(path.join(OUTPUT_DIR, 'duplicates_only.csv'), duplicates, masterHeaders);
  
  // Generate summary report
  const report = generateReport(stats, uniqueRows.length, withValidPhone.length, withoutPhone.length, withFullInfo.length);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'analysis_report.txt'), report);
  
  console.log('\n' + '='.repeat(70));
  console.log('📁 OUTPUT FILES CREATED:');
  console.log('='.repeat(70));
  console.log(`  1. master_all_businesses.csv - All unique businesses (${uniqueRows.length.toLocaleString()})`);
  console.log(`  2. with_valid_phone.csv - Businesses with valid phones (${withValidPhone.length.toLocaleString()})`);
  console.log(`  3. without_phone.csv - Businesses without phones (${withoutPhone.length.toLocaleString()})`);
  console.log(`  4. with_invalid_phone.csv - Invalid phone numbers (${withInvalidPhone.length.toLocaleString()})`);
  console.log(`  5. with_full_info.csv - Complete business records (${withFullInfo.length.toLocaleString()})`);
  console.log(`  6. duplicates_only.csv - Duplicate records (${duplicates.length.toLocaleString()})`);
  console.log(`  7. analysis_report.txt - Detailed report`);
  console.log('='.repeat(70));
  console.log(`\n✅ Analysis complete! Check: ${OUTPUT_DIR}`);
}

async function writeCSV(filePath, rows, headers) {
  const csvStream = format({ headers });
  const writeStream = fs.createWriteStream(filePath);
  
  csvStream.pipe(writeStream);
  
  for (const row of rows) {
    const csvRow = {};
    headers.forEach(h => {
      csvRow[h] = row[h] !== undefined ? row[h] : '';
    });
    csvStream.write(csvRow);
  }
  
  csvStream.end();
  await new Promise((resolve) => writeStream.on('finish', resolve));
}

function generateReport(stats, uniqueCount, validPhoneCount, noPhoneCount, fullInfoCount) {
  return `
================================================================================
                    DATA ANALYSIS REPORT
================================================================================
Generated: ${new Date().toISOString()}
Input Directory: ${INPUT_DIR}

SUMMARY STATISTICS
================================================================================
Total Files Processed:      ${stats.totalFiles}
Total Rows Scanned:         ${stats.totalRows.toLocaleString()}
Unique Businesses:          ${uniqueCount.toLocaleString()}
Duplicates Found:           ${stats.duplicates.toLocaleString()}

PHONE ANALYSIS
================================================================================
Valid Iraqi Phones:         ${stats.validPhones.toLocaleString()} (${((stats.validPhones/stats.totalRows)*100).toFixed(1)}%)
Missing Phones:             ${stats.noPhones.toLocaleString()} (${((stats.noPhones/stats.totalRows)*100).toFixed(1)}%)
Invalid Phones:             ${stats.invalidPhones.toLocaleString()} (${((stats.invalidPhones/stats.totalRows)*100).toFixed(1)}%)

BUSINESS QUALITY
================================================================================
With Full Information:      ${stats.withFullInfo.toLocaleString()} (${((stats.withFullInfo/stats.totalRows)*100).toFixed(1)}%)
  (Name + Governorate + Valid Phone)

FILES PROCESSED
================================================================================
${stats.filesProcessed.map(f => `  - ${f.file}: ${f.rows.toLocaleString()} rows`).join('\n')}

OUTPUT FILES
================================================================================
1. master_all_businesses.csv    - ${uniqueCount.toLocaleString()} unique businesses
2. with_valid_phone.csv         - ${validPhoneCount.toLocaleString()} with valid phones
3. without_phone.csv            - ${noPhoneCount.toLocaleString()} without phones
4. with_invalid_phone.csv       - ${stats.invalidPhones.toLocaleString()} invalid phones
5. with_full_info.csv           - ${fullInfoCount.toLocaleString()} complete records
6. duplicates_only.csv          - ${stats.duplicates.toLocaleString()} duplicates
7. analysis_report.txt          - This report

RECOMMENDATIONS
================================================================================
For MVP Launch: Use 'with_full_info.csv' (${fullInfoCount.toLocaleString()} businesses)
These have: Business Name + Governorate + Valid Phone

For Marketing: Use 'with_valid_phone.csv' (${validPhoneCount.toLocaleString()} businesses)
These can receive WhatsApp/SMS messages

For Data Enrichment: Review 'without_phone.csv' (${noPhoneCount.toLocaleString()} businesses)
These need phone research

================================================================================
`;
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
