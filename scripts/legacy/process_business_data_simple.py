#!/usr/bin/env python3
"""
Business Data Processor - Simple Version (no pandas dependency)
Processes CSV and XLSX files containing business data with phone number validation
"""

import csv
import os
import sys
from pathlib import Path
import re
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('processing.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

class SimpleBusinessDataProcessor:
    def __init__(self, input_folder: str, output_folder: str):
        self.input_folder = Path(input_folder)
        self.output_folder = Path(output_folder)
        self.output_folder.mkdir(exist_ok=True)
        
        # Iraqi phone number patterns (11 digits)
        self.iraqi_patterns = [
            r'^0?7[3-9][0-9]{8}$',  # Mobile: 07xxx xxx xxx or 7xxx xxx xxx (11 digits with 0, 10 without)
            r'^0?1[0-9]{9}$',       # Landline: 01xxxxxxxx (11 digits with 0)
            r'^0?2[0-9]{9}$',       # Landline: 02xxxxxxxx (11 digits with 0)
            r'^0?3[0-9]{9}$',       # Landline: 03xxxxxxxx (11 digits with 0)
            r'^0?4[0-9]{9}$',       # Landline: 04xxxxxxxx (11 digits with 0)
            r'^0?5[0-9]{9}$',       # Landline: 05xxxxxxxx (11 digits with 0)
            r'^0?6[0-9]{9}$',       # Landline: 06xxxxxxxx (11 digits with 0)
            r'^0?7[0-9]{9}$',       # Landline: 07xxxxxxxx (11 digits with 0)
            r'^0?8[0-9]{9}$',       # Landline: 08xxxxxxxx (11 digits with 0)
            r'^0?9[0-9]{9}$',       # Landline: 09xxxxxxxx (11 digits with 0)
        ]
        
        # Common business name column indicators
        self.business_name_indicators = [
            'name', 'business', 'company', 'shop', 'store', 'restaurant',
            'cafe', 'hotel', 'market', 'mall', 'center', 'clinic', 'hospital',
            'school', 'bank', 'office', 'agency', 'service', 'place'
        ]
        
        # Common phone column indicators
        self.phone_indicators = [
            'phone', 'telephone', 'tel', 'mobile', 'contact', 'number',
            'رقم', 'هاتف', 'جوال', 'موبايل'
        ]
        
        # Common address column indicators
        self.address_indicators = [
            'address', 'location', 'addr', 'street', 'city', 'area',
            'عنوان', 'موقع', 'شارع', 'منطقة'
        ]
        
        self.processed_files = 0
        self.total_rows = 0
        self.valid_phones = 0
        self.invalid_phones = 0

    def detect_columns(self, headers):
        """Auto-detect business name, phone, and address columns"""
        headers_lower = [h.lower().strip() for h in headers]
        
        detected = {
            'business_name': None,
            'phone': None,
            'address': None
        }
        
        # Detect business name column
        for i, header in enumerate(headers_lower):
            if any(indicator in header for indicator in self.business_name_indicators):
                detected['business_name'] = headers[i]
                break
        
        # Detect phone column
        for i, header in enumerate(headers_lower):
            if any(indicator in header for indicator in self.phone_indicators):
                detected['phone'] = headers[i]
                break
        
        # Detect address column
        for i, header in enumerate(headers_lower):
            if any(indicator in header for indicator in self.address_indicators):
                detected['address'] = headers[i]
                break
        
        # If no business name found, use first text column
        if not detected['business_name']:
            detected['business_name'] = headers[0] if headers else None
        
        return detected

    def normalize_phone_number(self, phone):
        """Normalize and validate Iraqi phone numbers"""
        if not phone or phone == '':
            return '', 'empty'
        
        # Convert to string and clean
        phone_str = str(phone).strip()
        
        # Remove common separators and spaces
        phone_str = re.sub(r'[\s\-\.\(\)\+]', '', phone_str)
        
        # Remove country code if present
        if phone_str.startswith('964'):
            phone_str = phone_str[3:]
        elif phone_str.startswith('+964'):
            phone_str = phone_str[4:]
        
        # Normalize to 11 digits
        if len(phone_str) == 11 and phone_str.startswith('0'):
            # Already correct format
            pass
        elif len(phone_str) == 10 and not phone_str.startswith('0'):
            # Add leading 0
            phone_str = '0' + phone_str
        elif len(phone_str) == 10 and phone_str.startswith('0'):
            # Remove leading 0 and add back (normalize)
            phone_str = phone_str[1:]
            phone_str = '0' + phone_str
        elif len(phone_str) == 11 and not phone_str.startswith('0'):
            # Missing leading 0
            phone_str = '0' + phone_str
        
        # Validate against Iraqi patterns
        for pattern in self.iraqi_patterns:
            if re.match(pattern, phone_str):
                return phone_str, 'valid'
        
        return phone_str, 'invalid'

    def is_suspicious_data(self, row, business_name_col, phone_col):
        """Detect suspicious or fake data"""
        suspicious_patterns = [
            r'test', r'demo', r'sample', r'fake', r'123', r'000', r'111',
            r'example', r'placeholder', r'xxxx', r'na', r'n/a', r'none'
        ]
        
        # Check business name
        if business_name_col and business_name_col in row:
            name_str = str(row[business_name_col]).lower().strip()
            if any(re.search(pattern, name_str) for pattern in suspicious_patterns):
                return True
        
        # Check phone
        if phone_col and phone_col in row:
            phone_str = str(row[phone_col]).lower().strip()
            if any(re.search(pattern, phone_str) for pattern in suspicious_patterns):
                return True
        
        # Check for repeated digits (suspicious pattern)
        if phone_col and phone_col in row:
            phone_str = str(row[phone_col]).replace('-', '').replace(' ', '')
            if len(set(phone_str)) <= 2:  # Too few unique digits
                return True
        
        return False

    def read_csv_file(self, file_path):
        """Read CSV file and return data"""
        data = []
        try:
            with open(file_path, 'r', encoding='utf-8', newline='') as file:
                reader = csv.DictReader(file)
                headers = reader.fieldnames
                for row in reader:
                    data.append(row)
            return headers, data
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                with open(file_path, 'r', encoding='latin-1', newline='') as file:
                    reader = csv.DictReader(file)
                    headers = reader.fieldnames
                    for row in reader:
                        data.append(row)
                return headers, data
            except Exception as e:
                logging.error(f"Error reading CSV {file_path}: {e}")
                return None, None
        except Exception as e:
            logging.error(f"Error reading CSV {file_path}: {e}")
            return None, None

    def process_file(self, file_path):
        """Process a single file and return three datasets"""
        logging.info(f"Processing: {file_path.name}")
        
        if file_path.suffix.lower() == '.csv':
            headers, data = self.read_csv_file(file_path)
            if not headers or not data:
                return [], [], []
        else:
            # XLSX files not supported in simple version
            logging.warning(f"XLSX files not supported in simple version. Skipping {file_path.name}")
            return [], [], []
        
        logging.info(f"Found {len(data)} rows in {file_path.name}")
        
        # Detect columns
        detected = self.detect_columns(headers)
        logging.info(f"Detected columns: {detected}")
        
        # Process data
        valid_phones = []
        no_phones = []
        invalid_phones = []
        
        for row in data:
            # Add processing columns
            row['source_file'] = file_path.name
            original_phone = row.get(detected['phone'], '') if detected['phone'] else ''
            row['original_phone'] = original_phone
            
            normalized_phone, phone_status = self.normalize_phone_number(original_phone)
            row['normalized_phone'] = normalized_phone
            row['phone_status'] = phone_status
            
            # Check for suspicious data
            row['is_suspicious'] = self.is_suspicious_data(row, detected['business_name'], detected['phone'])
            
            # Classify
            if phone_status == 'valid' and not row['is_suspicious']:
                valid_phones.append(row)
            elif phone_status in ['empty', '']:
                no_phones.append(row)
            else:
                invalid_phones.append(row)
        
        # Update statistics
        self.total_rows += len(data)
        self.valid_phones += len(valid_phones)
        self.invalid_phones += len(invalid_phones)
        
        logging.info(f"Valid phones: {len(valid_phones)}, No phone: {len(no_phones)}, Invalid: {len(invalid_phones)}")
        
        return valid_phones, no_phones, invalid_phones

    def remove_duplicates(self, data):
        """Remove duplicate rows based on business name and phone"""
        if not data:
            return data
        
        seen = set()
        unique_data = []
        
        for row in data:
            # Create key based on normalized phone and business name
            phone_key = row.get('normalized_phone', '')
            business_name = ''
            
            # Find business name column
            for key, value in row.items():
                if any(indicator in key.lower() for indicator in self.business_name_indicators):
                    business_name = str(value).lower().strip()
                    break
            
            duplicate_key = (phone_key, business_name)
            
            if duplicate_key not in seen:
                seen.add(duplicate_key)
                unique_data.append(row)
        
        logging.info(f"Removed {len(data) - len(unique_data)} duplicates")
        return unique_data

    def write_csv_file(self, data, file_path):
        """Write data to CSV file"""
        if not data:
            return
        
        # Get all possible headers
        all_headers = set()
        for row in data:
            all_headers.update(row.keys())
        
        # Sort headers for consistency
        headers = sorted(all_headers)
        
        try:
            with open(file_path, 'w', encoding='utf-8', newline='') as file:
                writer = csv.DictWriter(file, fieldnames=headers)
                writer.writeheader()
                writer.writerows(data)
            logging.info(f"Saved data to: {file_path}")
        except Exception as e:
            logging.error(f"Error writing to {file_path}: {e}")

    def process_all_files(self):
        """Process all files in the input folder"""
        logging.info(f"Starting processing in: {self.input_folder}")
        
        # Find all CSV files (simple version only supports CSV)
        files = list(self.input_folder.glob('*.csv'))
        
        if not files:
            logging.error("No CSV files found!")
            return
        
        logging.info(f"Found {len(files)} CSV files to process")
        
        # Process all files
        all_valid_phones = []
        all_no_phones = []
        all_invalid_phones = []
        
        for file_path in files:
            valid_data, no_phone_data, invalid_data = self.process_file(file_path)
            
            if valid_data:
                all_valid_phones.extend(valid_data)
            if no_phone_data:
                all_no_phones.extend(no_phone_data)
            if invalid_data:
                all_invalid_phones.extend(invalid_data)
            
            self.processed_files += 1
        
        # Remove duplicates
        all_valid_phones = self.remove_duplicates(all_valid_phones)
        all_no_phones = self.remove_duplicates(all_no_phones)
        all_invalid_phones = self.remove_duplicates(all_invalid_phones)
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if all_valid_phones:
            valid_file = self.output_folder / f"valid_phones_{timestamp}.csv"
            self.write_csv_file(all_valid_phones, valid_file)
        
        if all_no_phones:
            no_phone_file = self.output_folder / f"no_phone_{timestamp}.csv"
            self.write_csv_file(all_no_phones, no_phone_file)
        
        if all_invalid_phones:
            invalid_file = self.output_folder / f"invalid_phones_{timestamp}.csv"
            self.write_csv_file(all_invalid_phones, invalid_file)
        
        # Generate summary report
        self.generate_summary_report(timestamp)
        
        logging.info("Processing completed successfully!")

    def generate_summary_report(self, timestamp):
        """Generate a summary report"""
        report = f"""
BUSINESS DATA PROCESSING REPORT
===============================
Processing Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Input Folder: {self.input_folder}
Output Folder: {self.output_folder}

SUMMARY STATISTICS:
------------------
Files Processed: {self.processed_files}
Total Rows: {self.total_rows}
Valid Phone Numbers: {self.valid_phones}
Invalid/Suspicious Phone Numbers: {self.invalid_phones}
No Phone Numbers: {self.total_rows - self.valid_phones - self.invalid_phones}

OUTPUT FILES:
------------
- valid_phones_{timestamp}.csv ({self.valid_phones} rows)
- no_phone_{timestamp}.csv ({self.total_rows - self.valid_phones - self.invalid_phones} rows)
- invalid_phones_{timestamp}.csv ({self.invalid_phones} rows)

PHONE NUMBER VALIDATION:
-----------------------
- Iraqi mobile numbers: 07xxx xxx xxx format (11 digits with 0 prefix)
- Iraqi landline numbers: 01-09 + 9 digits (11 digits total with 0 prefix)
- Country code normalization: +964 → 0 prefix
- Duplicate removal based on phone and business name

DATA QUALITY CHECKS:
-------------------
- Suspicious pattern detection
- Fake/test data identification
- Duplicate removal
- Original data preservation

Processing log saved to: processing.log
"""
        
        report_file = self.output_folder / f"processing_report_{timestamp}.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logging.info(f"Summary report saved to: {report_file}")
        print(report)

def main():
    """Main function"""
    input_folder = r"C:\Users\HB LAPTOP STORE\Downloads\csv-busineses"
    output_folder = r"C:\Users\HB LAPTOP STORE\Downloads\csv-busineses\output"
    
    # Check if input folder exists
    if not os.path.exists(input_folder):
        print(f"Error: Input folder '{input_folder}' does not exist!")
        sys.exit(1)
    
    # Create processor and run
    processor = SimpleBusinessDataProcessor(input_folder, output_folder)
    processor.process_all_files()

if __name__ == "__main__":
    main()
