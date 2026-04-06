#!/usr/bin/env python3
"""
Business Data Processor - Phone Number Validation and Deduplication
Processes CSV and XLSX files containing business data with phone number validation
"""

import pandas as pd
import numpy as np
import re
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging
from datetime import datetime
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('processing.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

class BusinessDataProcessor:
    def __init__(self, input_folder: str, output_folder: str):
        self.input_folder = Path(input_folder)
        self.output_folder = Path(output_folder)
        self.output_folder.mkdir(exist_ok=True)
        
        # Iraqi phone number patterns
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

    def detect_columns(self, df: pd.DataFrame) -> Dict[str, str]:
        """Auto-detect business name, phone, and address columns"""
        columns = df.columns.str.lower().str.strip()
        
        detected = {
            'business_name': None,
            'phone': None,
            'address': None
        }
        
        # Detect business name column
        for col in columns:
            if any(indicator in col for indicator in self.business_name_indicators):
                detected['business_name'] = df.columns[columns.get_loc(col)]
                break
        
        # Detect phone column
        for col in columns:
            if any(indicator in col for indicator in self.phone_indicators):
                detected['phone'] = df.columns[columns.get_loc(col)]
                break
        
        # Detect address column
        for col in columns:
            if any(indicator in col for indicator in self.address_indicators):
                detected['address'] = df.columns[columns.get_loc(col)]
                break
        
        # If no business name found, use first text column
        if not detected['business_name']:
            for col in df.columns:
                if df[col].dtype == 'object':
                    detected['business_name'] = col
                    break
        
        return detected

    def normalize_phone_number(self, phone: str) -> Tuple[str, str]:
        """Normalize and validate Iraqi phone numbers"""
        if pd.isna(phone) or phone == '':
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
        
        # Remove leading 0 if present and add it back
        if len(phone_str) == 11 and phone_str.startswith('0'):
            phone_str = phone_str[1:]
            phone_str = '0' + phone_str
        elif len(phone_str) == 10 and not phone_str.startswith('0'):
            phone_str = '0' + phone_str
        elif len(phone_str) == 10 and phone_str.startswith('0'):
            # Already correct format (0 + 10 digits)
            pass
        elif len(phone_str) == 11 and not phone_str.startswith('0'):
            # Missing leading 0
            phone_str = '0' + phone_str
        
        # Validate against Iraqi patterns
        for pattern in self.iraqi_patterns:
            if re.match(pattern, phone_str):
                return phone_str, 'valid'
        
        return phone_str, 'invalid'

    def is_suspicious_data(self, row: pd.Series, business_name_col: str, phone_col: str) -> bool:
        """Detect suspicious or fake data"""
        suspicious_patterns = [
            r'test', r'demo', r'sample', r'fake', r'123', r'000', r'111',
            r'example', r'placeholder', r'xxxx', r'na', r'n/a', r'none'
        ]
        
        # Check business name
        if business_name_col and not pd.isna(row[business_name_col]):
            name_str = str(row[business_name_col]).lower().strip()
            if any(re.search(pattern, name_str) for pattern in suspicious_patterns):
                return True
        
        # Check phone
        if phone_col and not pd.isna(row[phone_col]):
            phone_str = str(row[phone_col]).lower().strip()
            if any(re.search(pattern, phone_str) for pattern in suspicious_patterns):
                return True
        
        # Check for repeated digits (suspicious pattern)
        if phone_col and not pd.isna(row[phone_col]):
            phone_str = str(row[phone_col]).replace('-', '').replace(' ', '')
            if len(set(phone_str)) <= 2:  # Too few unique digits
                return True
        
        return False

    def process_file(self, file_path: Path) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Process a single file and return three DataFrames"""
        logging.info(f"Processing: {file_path.name}")
        
        try:
            # Read file
            if file_path.suffix.lower() == '.csv':
                df = pd.read_csv(file_path, encoding='utf-8')
            else:  # XLSX
                df = pd.read_excel(file_path)
            
            logging.info(f"Found {len(df)} rows in {file_path.name}")
            
            # Detect columns
            detected = self.detect_columns(df)
            logging.info(f"Detected columns: {detected}")
            
            # Add processing columns
            df['source_file'] = file_path.name
            df['original_phone'] = df[detected['phone']] if detected['phone'] else ''
            df['normalized_phone'] = ''
            df['phone_status'] = ''
            df['is_suspicious'] = False
            
            # Process each row
            for idx, row in df.iterrows():
                # Normalize phone
                original_phone = row['original_phone']
                normalized_phone, phone_status = self.normalize_phone_number(original_phone)
                df.at[idx, 'normalized_phone'] = normalized_phone
                df.at[idx, 'phone_status'] = phone_status
                
                # Check for suspicious data
                if detected['business_name'] and detected['phone']:
                    df.at[idx, 'is_suspicious'] = self.is_suspicious_data(
                        row, detected['business_name'], detected['phone']
                    )
            
            # Classify rows
            valid_phone_df = df[
                (df['phone_status'] == 'valid') & 
                (~df['is_suspicious'])
            ].copy()
            
            no_phone_df = df[
                (df['phone_status'] == 'empty') | 
                (df['phone_status'] == '')
            ].copy()
            
            invalid_phone_df = df[
                (df['phone_status'] == 'invalid') | 
                (df['is_suspicious'])
            ].copy()
            
            # Update statistics
            self.total_rows += len(df)
            self.valid_phones += len(valid_phone_df)
            self.invalid_phones += len(invalid_phone_df)
            
            logging.info(f"Valid phones: {len(valid_phone_df)}, No phone: {len(no_phone_df)}, Invalid: {len(invalid_phone_df)}")
            
            return valid_phone_df, no_phone_df, invalid_phone_df
            
        except Exception as e:
            logging.error(f"Error processing {file_path}: {str(e)}")
            return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

    def remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove duplicate rows based on business name and phone"""
        if df.empty:
            return df
        
        # Sort columns for consistent duplicate detection
        cols_to_check = ['normalized_phone']
        
        # Add business name if available
        business_cols = [col for col in df.columns if any(
            indicator in col.lower() for indicator in self.business_name_indicators
        )]
        if business_cols:
            cols_to_check.extend(business_cols[:1])  # Use first business name column
        
        # Remove duplicates
        if cols_to_check:
            df_deduped = df.drop_duplicates(subset=cols_to_check, keep='first')
            logging.info(f"Removed {len(df) - len(df_deduped)} duplicates")
            return df_deduped
        
        return df

    def process_all_files(self):
        """Process all files in the input folder"""
        logging.info(f"Starting processing in: {self.input_folder}")
        
        # Find all CSV and XLSX files
        files = []
        for ext in ['*.csv', '*.xlsx', '*.xls']:
            files.extend(self.input_folder.glob(ext))
        
        if not files:
            logging.error("No CSV or XLSX files found!")
            return
        
        logging.info(f"Found {len(files)} files to process")
        
        # Process all files
        all_valid_phones = []
        all_no_phones = []
        all_invalid_phones = []
        
        for file_path in files:
            valid_df, no_phone_df, invalid_df = self.process_file(file_path)
            
            if not valid_df.empty:
                all_valid_phones.append(valid_df)
            if not no_phone_df.empty:
                all_no_phones.append(no_phone_df)
            if not invalid_df.empty:
                all_invalid_phones.append(invalid_df)
            
            self.processed_files += 1
        
        # Combine all DataFrames
        if all_valid_phones:
            combined_valid = pd.concat(all_valid_phones, ignore_index=True)
            combined_valid = self.remove_duplicates(combined_valid)
        else:
            combined_valid = pd.DataFrame()
        
        if all_no_phones:
            combined_no_phone = pd.concat(all_no_phones, ignore_index=True)
            combined_no_phone = self.remove_duplicates(combined_no_phone)
        else:
            combined_no_phone = pd.DataFrame()
        
        if all_invalid_phones:
            combined_invalid = pd.concat(all_invalid_phones, ignore_index=True)
            combined_invalid = self.remove_duplicates(combined_invalid)
        else:
            combined_invalid = pd.DataFrame()
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if not combined_valid.empty:
            valid_file = self.output_folder / f"valid_phones_{timestamp}.xlsx"
            combined_valid.to_excel(valid_file, index=False)
            logging.info(f"Saved valid phones to: {valid_file}")
        
        if not combined_no_phone.empty:
            no_phone_file = self.output_folder / f"no_phone_{timestamp}.xlsx"
            combined_no_phone.to_excel(no_phone_file, index=False)
            logging.info(f"Saved no phone data to: {no_phone_file}")
        
        if not combined_invalid.empty:
            invalid_file = self.output_folder / f"invalid_phones_{timestamp}.xlsx"
            combined_invalid.to_excel(invalid_file, index=False)
            logging.info(f"Saved invalid phones to: {invalid_file}")
        
        # Generate summary report
        self.generate_summary_report(timestamp)
        
        logging.info("Processing completed successfully!")

    def generate_summary_report(self, timestamp: str):
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
- valid_phones_{timestamp}.xlsx ({self.valid_phones} rows)
- no_phone_{timestamp}.xlsx ({self.total_rows - self.valid_phones - self.invalid_phones} rows)
- invalid_phones_{timestamp}.xlsx ({self.invalid_phones} rows)

PHONE NUMBER VALIDATION:
-----------------------
- Iraqi mobile numbers: 07xxx xxx xxx format
- Iraqi landline numbers: 01-09 + 8 digits
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
    processor = BusinessDataProcessor(input_folder, output_folder)
    processor.process_all_files()

if __name__ == "__main__":
    main()
