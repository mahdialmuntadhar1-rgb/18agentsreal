# Business Data Processor

A Python script to process and validate business data from CSV and XLSX files with focus on Iraqi phone number validation and deduplication.

## Features

- **Automatic Column Detection**: Identifies business name, phone, and address columns
- **Iraqi Phone Validation**: Validates and normalizes Iraqi mobile and landline numbers
- **Data Classification**: Separates data into valid phones, no phones, and invalid/suspicious
- **Duplicate Removal**: Removes duplicate entries based on phone and business name
- **Suspicious Data Detection**: Identifies fake/test data patterns
- **Original Language Preservation**: Keeps all original data intact

## Phone Number Validation

The script validates Iraqi phone numbers in these formats:
- **Mobile**: 07xxx xxx xxx (11 digits with 0 prefix)
- **Landline**: 01-09 + 9 digits (11 digits total with 0 prefix)
- **Country Code**: Normalizes +964 format to local 0 prefix

## Installation and Setup

### 1. Install Required Packages
```powershell
pip install -r requirements.txt
```

### 2. Run the Script
```powershell
cd "C:\Users\HB LAPTOP STORE\Downloads\csv-busineses"
python process_business_data.py
```

Or use the provided PowerShell script:
```powershell
.\setup_commands.ps1
```

## Input Requirements

Place your CSV and XLSX files in:
```
C:\Users\HB LAPTOP STORE\Downloads\csv-busineses\
```

## Output Files

The script creates an `output` folder with:

- **valid_phones_[timestamp].xlsx** - Valid Iraqi phone numbers
- **no_phone_[timestamp].xlsx** - Entries without phone numbers
- **invalid_phones_[timestamp].xlsx** - Invalid or suspicious phone numbers
- **processing_report_[timestamp].txt** - Detailed processing summary
- **processing.log** - Complete processing log

## Output Columns

All original columns are preserved plus:

- `source_file` - Original filename
- `original_phone` - Raw phone number from source
- `normalized_phone` - Cleaned/standardized phone number
- `phone_status` - valid/invalid/empty
- `is_suspicious` - Flag for potentially fake data

## Data Quality Features

- **Suspicious Pattern Detection**: Identifies test/fake data
- **Duplicate Removal**: Based on phone and business name
- **Format Normalization**: Standardizes phone number formats
- **Encoding Support**: Handles UTF-8 and Arabic text

## Processing Statistics

The script provides:
- Total files processed
- Rows per category
- Duplicate removal counts
- Data quality metrics

## Requirements

- Python 3.7+
- pandas
- numpy
- openpyxl
- xlrd

## Troubleshooting

1. **Encoding Issues**: Ensure CSV files are UTF-8 encoded
2. **Memory Issues**: Process large files in smaller batches
3. **Column Detection**: Manual column mapping may be needed for unusual formats

## Example Output Structure

```
output/
├── valid_phones_20240405_143022.xlsx
├── no_phone_20240405_143022.xlsx
├── invalid_phones_20240405_143022.xlsx
├── processing_report_20240405_143022.txt
└── processing.log
```
