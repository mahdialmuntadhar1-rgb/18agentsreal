#!/usr/bin/env node
/**
 * Data Standardization Pipeline - Phase 1
 * Processes all imported files and creates unified master dataset
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import XLSX from 'xlsx';
import { format } from 'fast-csv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  rawDir: './data/import/raw',
  samplesDir: './data/import/samples',
  outputDir: './data/output',
  masterHeaders: [
    'ID', 'Business Name', 'Arabic Name', 'English Name', 'Category', 'Subcategory',
    'Governorate', 'City', 'Neighborhood', 'Phone 1', 'Phone 2', 'WhatsApp',
    'Email 1', 'Website', 'Facebook', 'Instagram', 'TikTok', 'Telegram',
    'Opening Hours', 'Status', 'Rating', 'Verification', 'Confidence'
  ],
  trackingFields: ['source_file', 'import_batch_id', 'original_row_id'],
  requiredFields: ['Business Name', 'Governorate', 'Phone 1']
};

// Header mapping dictionary (source -> master)
const headerMappings = {
  // ID mappings
  'id': 'ID',
  'ID': 'ID',
  'business_id': 'ID',
  
  // Name mappings
  'name': 'Business Name',
  'business_name': 'Business Name',
  'businessName': 'Business Name',
  'title': 'Business Name',
  'company_name': 'Business Name',
  
  // Arabic name
  'nameAr': 'Arabic Name',
  'name_ar': 'Arabic Name',
  'namear': 'Arabic Name',
  'arabic_name': 'Arabic Name',
  'الاسم': 'Arabic Name',
  
  // English name - REMOVED nameKu mapping (Kurdish, not English)
  // Only true English names should go here
  'english_name': 'English Name',
  'en_name': 'English Name',
  
  // Kurdish name (Sorani) - preserved in unmapped, not mapped to English
  // nameKu is intentionally NOT mapped to English Name
  
  // Category
  'category': 'Category',
  'type': 'Category',
  'business_type': 'Category',
  'sector': 'Category',
  
  // Subcategory
  'subcategory': 'Subcategory',
  'sub_category': 'Subcategory',
  'specialty': 'Subcategory',
  
  // Location
  'governorate': 'Governorate',
  'gov': 'Governorate',
  'province': 'Governorate',
  'state': 'Governorate',
  'city': 'City',
  'town': 'City',
  'address': 'Neighborhood',
  'neighborhood': 'Neighborhood',
  'area': 'Neighborhood',
  'district': 'Neighborhood',
  
  // Phone
  'phone': 'Phone 1',
  'phone_number': 'Phone 1',
  'telephone': 'Phone 1',
  'mobile': 'Phone 1',
  'phone1': 'Phone 1',
  'phone_1': 'Phone 1',
  'phone2': 'Phone 2',
  'phone_2': 'Phone 2',
  'whatsapp': 'WhatsApp',
  'whatsApp': 'WhatsApp',
  'whatsapp_number': 'WhatsApp',
  
  // Contact
  'email': 'Email 1',
  'email_address': 'Email 1',
  'e-mail': 'Email 1',
  'website': 'Website',
  'web': 'Website',
  'url': 'Website',
  'site': 'Website',
  'facebook': 'Facebook',
  'fb': 'Facebook',
  'instagram': 'Instagram',
  'ig': 'Instagram',
  'tiktok': 'TikTok',
  'telegram': 'Telegram',
  'tg': 'Telegram',
  
  // Business info
  'openHours': 'Opening Hours',
  'open_hours': 'Opening Hours',
  'opening_hours': 'Opening Hours',
  'hours': 'Opening Hours',
  'status': 'Status',
  'business_status': 'Status',
  'rating': 'Rating',
  'stars': 'Rating',
  'isVerified': 'Verification',
  'verified': 'Verification',
  'verification_status': 'Verification',
  'confidence_score': 'Confidence',
  'confidence': 'Confidence',
  'score': 'Confidence'
};

// Results tracking
const results = {
  filesProcessed: [],
  headersFound: {},
  mappingDecisions: [],
  unmappedFields: [],
  totalRows: 0,
  standardizedRows: 0,
  missingRequired: 0,
  validPhoneCount: 0,
  invalidPhoneCount: 0,
  phoneStats: { valid: 0, invalid: 0, missing: 0 },
  errors: []
};

// Ensure output directory exists
function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

// Extract and normalize Iraqi phone numbers
function normalizePhone(phone) {
  if (!phone || phone === '' || phone === null || phone === undefined) {
    return { normalized: null, valid: false, type: 'missing', original: '' };
  }
  
  let original = String(phone).trim();
  
  // Extract all digit sequences from the text (handles "Call 07701234567 or 07801234568")
  const digitMatches = original.match(/\d+/g);
  if (!digitMatches) {
    return { normalized: null, valid: false, type: 'invalid', original };
  }
  
  // Join digits and try to find phone numbers
  let allDigits = digitMatches.join('');
  
  // Try to extract Iraqi phone numbers from the digit string
  // Pattern: (964|00964|\+964)?0?7[3-9]\d{8}
  const iraqiPhoneRegex = /(?:964|00964|\+964)?0?7[3-9]\d{8}/g;
  const matches = allDigits.match(iraqiPhoneRegex);
  
  if (!matches || matches.length === 0) {
    // No clear Iraqi pattern found - try to extract anything that looks like a phone
    // Look for 10-11 digit sequences starting with 07 or 7
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
    return { normalized: original, valid: false, type: 'unparseable', original };
  }
  
  // Normalize each match to 07XXXXXXXXX format
  const normalized = matches.map(match => {
    let digits = match;
    
    // Remove country code prefixes
    if (digits.startsWith('+964')) {
      digits = digits.slice(4);
    } else if (digits.startsWith('00964')) {
      digits = digits.slice(5);
    } else if (digits.startsWith('964')) {
      digits = digits.slice(3);
    }
    
    // Ensure leading zero
    if (!digits.startsWith('0')) {
      digits = '0' + digits;
    }
    
    return digits;
  });
  
  // Return first number as primary, rest as additional
  const primary = normalized[0];
  const additional = normalized.slice(1);
  
  // Validate: should be 11 digits starting with 07
  const isValid = /^07\d{9}$/.test(primary);
  
  return {
    normalized: isValid ? primary : original,
    valid: isValid,
    type: isValid ? 'valid' : 'invalid',
    additional: isValid ? additional : [],
    original
  };
}

// Normalize governorate names
function normalizeGovernorate(gov) {
  if (!gov) return '';
  const normalized = String(gov).trim();
  const governorateMap = {
    'baghdad': 'Baghdad',
    'basra': 'Basra',
    'erbil': 'Erbil',
    'arbil': 'Erbil',
    'sulaymaniyah': 'Sulaymaniyah',
    'slemany': 'Sulaymaniyah',
    'dohuk': 'Dohuk',
    'duhok': 'Dohuk',
    'nineveh': 'Nineveh',
    'mosul': 'Nineveh',
    'anbar': 'Al Anbar',
    'babil': 'Babil',
    'karbala': 'Karbala',
    'kerbela': 'Karbala',
    'najaf': 'Najaf',
    'qadisiyyah': 'Al-Qādisiyyah',
    'wasit': 'Wasit',
    'maysan': 'Maysan',
    'dhi_qar': 'Dhi Qar',
    'muthanna': 'Al Muthanna',
    'diyala': 'Diyala',
    'kirkuk': 'Kirkuk',
    'salah_al_din': 'Salah al-Din',
    'salahaldin': 'Salah al-Din'
  };
  
  const lower = normalized.toLowerCase().replace(/[^a-z]/g, '');
  return governorateMap[lower] || normalized;
}

// Process a single row
function processRow(row, fileName, batchId, rowIndex) {
  const mappedRow = {};
  const unmappedFields = [];
  
  // Map fields using header mappings
  for (const [sourceKey, value] of Object.entries(row)) {
    const normalizedKey = sourceKey.toLowerCase().trim();
    const mappedHeader = headerMappings[sourceKey] || headerMappings[normalizedKey];
    
    if (mappedHeader) {
      // Handle multiple fields mapping to same target (concatenate or choose best)
      if (mappedRow[mappedHeader] && value) {
        // If current value is better (longer, more complete), use it
        if (String(value).length > String(mappedRow[mappedHeader]).length) {
          mappedRow[mappedHeader] = value;
        }
      } else if (value !== null && value !== undefined && value !== '') {
        mappedRow[mappedHeader] = value;
      }
    } else {
      unmappedFields.push(sourceKey);
    }
  }
  
  // Handle phone normalization with multi-number extraction
  let phone1 = '';
  let phone2 = '';
  let hasValidPhone = false;
  let allExtractedPhones = [];
  
  // First, try to get phones from the 'phone' field (mapped to Phone 1)
  if (mappedRow['Phone 1']) {
    const phoneResult = normalizePhone(mappedRow['Phone 1']);
    
    if (phoneResult.valid) {
      phone1 = phoneResult.normalized;
      hasValidPhone = true;
      results.phoneStats.valid++;
      
      // Capture additional numbers found in the same field
      if (phoneResult.additional && phoneResult.additional.length > 0) {
        allExtractedPhones.push(...phoneResult.additional);
      }
    } else if (phoneResult.type === 'unparseable') {
      // Keep original if we couldn't parse it
      phone1 = phoneResult.original;
      results.phoneStats.invalid++;
    } else {
      phone1 = mappedRow['Phone 1'];
      results.phoneStats.invalid++;
    }
  }
  
  // Also check Phone 2 field
  if (mappedRow['Phone 2']) {
    const phone2Result = normalizePhone(mappedRow['Phone 2']);
    if (phone2Result.valid) {
      phone2 = phone2Result.normalized;
      results.phoneStats.valid++;
    } else {
      phone2 = phone2Result.original || mappedRow['Phone 2'];
    }
  }
  
  // If we have additional extracted phones and Phone 2 is empty, use the first additional
  if (allExtractedPhones.length > 0 && !phone2) {
    phone2 = allExtractedPhones[0];
    results.phoneStats.valid++;
  }
  
  // Also check whatsapp field as potential phone source
  if (!phone1 && mappedRow['WhatsApp']) {
    const waResult = normalizePhone(mappedRow['WhatsApp']);
    if (waResult.valid) {
      phone1 = waResult.normalized;
      hasValidPhone = true;
      results.phoneStats.valid++;
    }
  }
  
  // Normalize governorate
  const governorate = normalizeGovernorate(mappedRow['Governorate']);
  
  // Build standardized row with master headers
  const standardizedRow = {};
  
  CONFIG.masterHeaders.forEach(header => {
    switch (header) {
      case 'ID':
        standardizedRow[header] = mappedRow['ID'] || `${fileName}_${rowIndex}`;
        break;
      case 'Business Name':
        standardizedRow[header] = cleanName(mappedRow['Business Name']);
        break;
      case 'Arabic Name':
        standardizedRow[header] = cleanName(mappedRow['Arabic Name']);
        break;
      case 'English Name':
        standardizedRow[header] = cleanName(mappedRow['English Name']);
        break;
      case 'Category':
        standardizedRow[header] = normalizeCategory(mappedRow['Category']);
        break;
      case 'Subcategory':
        standardizedRow[header] = normalizeCategory(mappedRow['Subcategory']);
        break;
      case 'Governorate':
        standardizedRow[header] = governorate;
        break;
      case 'City':
        standardizedRow[header] = mappedRow['City'] ? String(mappedRow['City']).trim() : '';
        break;
      case 'Neighborhood':
        standardizedRow[header] = mappedRow['Neighborhood'] ? String(mappedRow['Neighborhood']).trim() : '';
        break;
      case 'Phone 1':
        standardizedRow[header] = phone1;
        break;
      case 'Phone 2':
        standardizedRow[header] = phone2;
        break;
      case 'WhatsApp':
        standardizedRow[header] = mappedRow['WhatsApp'] ? String(mappedRow['WhatsApp']).trim() : '';
        break;
      case 'Email 1':
        standardizedRow[header] = normalizeEmail(mappedRow['Email 1']);
        break;
      case 'Website':
        standardizedRow[header] = normalizeUrl(mappedRow['Website']);
        break;
      case 'Facebook':
      case 'Instagram':
      case 'TikTok':
      case 'Telegram':
        standardizedRow[header] = normalizeUrl(mappedRow[header]);
        break;
      case 'Opening Hours':
        standardizedRow[header] = mappedRow['Opening Hours'] ? String(mappedRow['Opening Hours']).trim() : '';
        break;
      case 'Status':
        standardizedRow[header] = mappedRow['Status'] || 'active';
        break;
      case 'Rating':
        standardizedRow[header] = normalizeRating(mappedRow['Rating']);
        break;
      case 'Verification':
        standardizedRow[header] = normalizeVerification(mappedRow['Verification']);
        break;
      case 'Confidence':
        standardizedRow[header] = normalizeConfidence(mappedRow['Confidence']);
        break;
      default:
        standardizedRow[header] = '';
    }
  });
  
  // Add tracking fields (not in master CSV but tracked internally)
  standardizedRow['_source_file'] = fileName;
  standardizedRow['_import_batch_id'] = batchId;
  standardizedRow['_original_row_id'] = mappedRow['ID'] || rowIndex;
  
  // Check minimum keep rule
  const hasBusinessName = standardizedRow['Business Name'] && standardizedRow['Business Name'].length > 0;
  const hasGovernorate = standardizedRow['Governorate'] && standardizedRow['Governorate'].length > 0;
  const hasPhone = standardizedRow['Phone 1'] && standardizedRow['Phone 1'].length > 0;
  
  const meetsMinimumKeep = hasBusinessName && hasGovernorate && hasPhone;
  
  if (!meetsMinimumKeep) {
    results.missingRequired++;
  }
  
  return {
    row: standardizedRow,
    meetsMinimumKeep,
    hasValidPhone,
    unmappedFields: [...new Set(unmappedFields)]
  };
}

// Helper functions
function cleanName(name) {
  if (!name) return '';
  return String(name).trim().replace(/\s+/g, ' ');
}

function normalizeCategory(category) {
  if (!category) return '';
  return String(category).trim();
}

function normalizeEmail(email) {
  if (!email) return '';
  const cleaned = String(email).trim().toLowerCase();
  // Basic email validation
  if (cleaned.includes('@') && cleaned.includes('.')) {
    return cleaned;
  }
  return cleaned;
}

function normalizeUrl(url) {
  if (!url) return '';
  let cleaned = String(url).trim();
  // Add https:// if missing
  if (cleaned && !cleaned.match(/^https?:\/\//i)) {
    if (cleaned.match(/^www\./i) || cleaned.match(/\.(com|net|org|io|app)$/i)) {
      cleaned = 'https://' + cleaned;
    }
  }
  return cleaned;
}

function normalizeRating(rating) {
  if (!rating) return '';
  const num = parseFloat(rating);
  if (isNaN(num)) return '';
  return Math.min(Math.max(num, 0), 5).toFixed(1);
}

function normalizeVerification(verification) {
  if (!verification) return 'unverified';
  const val = String(verification).toLowerCase();
  if (['true', 'verified', '1', 'yes'].includes(val)) return 'verified';
  if (['false', 'unverified', '0', 'no', 'pending'].includes(val)) return val;
  return 'unverified';
}

function normalizeConfidence(confidence) {
  if (!confidence) return '';
  const num = parseFloat(confidence);
  if (isNaN(num)) return '';
  return (num > 1 ? num / 100 : num).toFixed(2);
}

// Read CSV file
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const headers = [];
    
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('headers', (headerList) => {
        headers.push(...headerList);
      })
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve({ rows, headers }))
      .on('error', reject);
  });
}

// Read JSON file
async function readJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  // Handle both array and object formats
  let rows = Array.isArray(data) ? data : (data.businesses || data.data || [data]);
  
  // Extract headers from first row
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  
  return { rows, headers };
}

// Read XLSX file
async function readXLSX(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);
  
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  
  return { rows, headers };
}

// Process single file
async function processFile(filePath, fileName, batchId) {
  const ext = path.extname(fileName).toLowerCase();
  let data;
  
  try {
    if (ext === '.csv') {
      data = await readCSV(filePath);
    } else if (ext === '.json') {
      data = await readJSON(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
      data = await readXLSX(filePath);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  } catch (err) {
    results.errors.push({ file: fileName, error: err.message });
    return { rows: [], headers: [], standardized: [], unmapped: [] };
  }
  
  results.headersFound[fileName] = data.headers;
  
  const standardizedRows = [];
  const unmappedFields = new Set();
  
  for (let i = 0; i < data.rows.length; i++) {
    const result = processRow(data.rows[i], fileName, batchId, i);
    standardizedRows.push(result.row);
    
    if (result.unmappedFields.length > 0) {
      result.unmappedFields.forEach(f => unmappedFields.add(f));
    }
  }
  
  results.totalRows += data.rows.length;
  results.standardizedRows += standardizedRows.length;
  
  return {
    rows: data.rows,
    headers: data.headers,
    standardized: standardizedRows,
    unmapped: Array.from(unmappedFields)
  };
}

// Main processing function
async function main() {
  console.log('🚀 Starting Data Standardization Pipeline...\n');
  
  ensureOutputDir();
  
  const batchId = `batch_${Date.now()}`;
  const allStandardizedRows = [];
  const fileReport = [];
  
  // Get all files from both directories
  const rawFiles = fs.readdirSync(CONFIG.rawDir).filter(f => 
    f.endsWith('.csv') || f.endsWith('.json') || f.endsWith('.xlsx') || f.endsWith('.xls')
  );
  
  const sampleFiles = fs.readdirSync(CONFIG.samplesDir).filter(f => 
    f.endsWith('.csv') || f.endsWith('.json') || f.endsWith('.xlsx') || f.endsWith('.xls')
  );
  
  console.log(`Found ${rawFiles.length} files in raw/, ${sampleFiles.length} files in samples/\n`);
  
  // Process raw files
  for (const file of rawFiles) {
    const filePath = path.join(CONFIG.rawDir, file);
    console.log(`Processing: ${file}...`);
    
    const result = await processFile(filePath, file, batchId);
    
    fileReport.push({
      file,
      type: 'raw',
      rows: result.rows.length,
      headers: result.headers,
      standardized: result.standardized.length,
      unmappedFields: result.unmapped
    });
    
    allStandardizedRows.push(...result.standardized);
    results.filesProcessed.push(file);
    
    console.log(`  ✓ Standardized: ${result.standardized.length} rows`);
    if (result.unmapped.length > 0) {
      console.log(`  ⚠ Unmapped fields: ${result.unmapped.join(', ')}`);
    }
  }
  
  // Process sample files
  for (const file of sampleFiles) {
    const filePath = path.join(CONFIG.samplesDir, file);
    console.log(`Processing: ${file}...`);
    
    const result = await processFile(filePath, file, batchId);
    
    fileReport.push({
      file,
      type: 'sample',
      rows: result.rows.length,
      headers: result.headers,
      standardized: result.standardized.length,
      unmappedFields: result.unmapped
    });
    
    allStandardizedRows.push(...result.standardized);
    results.filesProcessed.push(file);
    
    console.log(`  ✓ Standardized: ${result.standardized.length} rows`);
    if (result.unmapped.length > 0) {
      console.log(`  ⚠ Unmapped fields: ${result.unmapped.join(', ')}`);
    }
  }
  
  // Write master CSV (without internal tracking fields)
  const masterHeaders = [...CONFIG.masterHeaders];
  const csvStream = format({ headers: masterHeaders });
  const writeStream = fs.createWriteStream(path.join(CONFIG.outputDir, 'master_standardized_dataset.csv'));
  
  csvStream.pipe(writeStream);
  
  for (const row of allStandardizedRows) {
    const csvRow = {};
    masterHeaders.forEach(h => csvRow[h] = row[h] || '');
    csvStream.write(csvRow);
  }
  
  csvStream.end();
  
  await new Promise((resolve) => writeStream.on('finish', resolve));
  
  // Generate header mapping report
  const mappingReport = generateMappingReport(fileReport);
  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'header_mapping_report.md'),
    mappingReport
  );
  
  // Generate summary JSON
  const summary = {
    batch_id: batchId,
    timestamp: new Date().toISOString(),
    files_processed: results.filesProcessed.length,
    total_rows_imported: results.totalRows,
    total_rows_standardized: results.standardizedRows,
    missing_required_fields: results.missingRequired,
    phone_stats: results.phoneStats,
    file_details: fileReport,
    unmapped_fields: [...new Set(results.unmappedFields)],
    errors: results.errors,
    output_files: {
      master_csv: 'data/output/master_standardized_dataset.csv',
      mapping_report: 'data/output/header_mapping_report.md',
      summary_json: 'data/output/standardization_summary.json'
    }
  };
  
  fs.writeFileSync(
    path.join(CONFIG.outputDir, 'standardization_summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 STANDARDIZATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Files processed: ${results.filesProcessed.length}`);
  console.log(`Total rows imported: ${results.totalRows}`);
  console.log(`Total rows standardized: ${results.standardizedRows}`);
  console.log(`Rows missing required fields: ${results.missingRequired}`);
  console.log(`Valid phone numbers: ${results.phoneStats.valid}`);
  console.log(`Invalid phone numbers: ${results.phoneStats.invalid}`);
  console.log(`Missing phone numbers: ${results.phoneStats.missing}`);
  console.log('\n📁 Output files:');
  console.log(`  - ${summary.output_files.master_csv}`);
  console.log(`  - ${summary.output_files.mapping_report}`);
  console.log(`  - ${summary.output_files.summary_json}`);
  console.log('='.repeat(60));
}

function generateMappingReport(fileReport) {
  let report = `# Header Mapping Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += `## Files Processed\n\n`;
  fileReport.forEach(file => {
    report += `### ${file.file} (${file.type})\n\n`;
    report += `- Rows: ${file.rows}\n`;
    report += `- Standardized: ${file.standardized}\n\n`;
    
    report += `#### Headers Found\n\n`;
    file.headers.forEach(h => {
      const mapped = headerMappings[h] || headerMappings[h.toLowerCase()];
      if (mapped) {
        report += `- \`${h}\` → **${mapped}** ✓\n`;
      } else {
        report += `- \`${h}\` → (unmapped)\n`;
      }
    });
    
    if (file.unmappedFields.length > 0) {
      report += `\n#### Unmapped Fields\n\n`;
      file.unmappedFields.forEach(f => {
        report += `- \`${f}\`\n`;
      });
    }
    
    report += `\n---\n\n`;
  });
  
  report += `## Master Headers\n\n`;
  CONFIG.masterHeaders.forEach(h => {
    report += `- ${h}\n`;
  });
  
  return report;
}

// Run
main().catch(err => {
  console.error('❌ Pipeline failed:', err);
  process.exit(1);
});
