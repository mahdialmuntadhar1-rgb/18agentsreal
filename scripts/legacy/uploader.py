#!/usr/bin/env python3
"""
Business Data Uploader for Supabase
Uploads CSV and Excel files to raw_import_businesses table
"""

import os
import json
import pandas as pd
from datetime import datetime
from supabase import create_client
import uuid
from typing import List, Dict, Any

# ==================== CONFIGURATION ====================
# PASTE YOUR SUPABASE CREDENTIALS HERE:
SUPABASE_URL = "YOUR_SUPABASE_URL_HERE"  # Replace with your Supabase URL
SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY_HERE"  # Replace with your Supabase anon key

# Fixed folder path as requested
DATA_FOLDER = r"C:\Users\HB LAPTOP STORE\Downloads\csv-busineses"
TABLE_NAME = "raw_import_businesses"
CHUNK_SIZE = 100
# =====================================================

def initialize_supabase():
    """Initialize Supabase client"""
    if SUPABASE_URL == "YOUR_SUPABASE_URL_HERE" or SUPABASE_KEY == "YOUR_SUPABASE_ANON_KEY_HERE":
        raise ValueError("Please update SUPABASE_URL and SUPABASE_KEY in the script")
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def read_csv_file(file_path: str) -> List[Dict[str, Any]]:
    """Read CSV file and return list of row dictionaries"""
    try:
        df = pd.read_csv(file_path)
        return df.to_dict('records')
    except Exception as e:
        print(f"  Error reading CSV {file_path}: {e}")
        return []

def read_excel_file(file_path: str) -> List[Dict[str, Any]]:
    """Read Excel file and return list of row dictionaries"""
    try:
        df = pd.read_excel(file_path)
        return df.to_dict('records')
    except Exception as e:
        print(f"  Error reading Excel {file_path}: {e}")
        return []

def upload_chunk(supabase, batch_id: str, source_file: str, rows_chunk: List[Dict[str, Any]]):
    """Upload a chunk of rows to Supabase"""
    try:
        records = []
        for row in rows_chunk:
            record = {
                'import_batch_id': batch_id,
                'source_file': source_file,
                'raw_payload': json.dumps(row, default=str)
            }
            records.append(record)
        
        result = supabase.table(TABLE_NAME).insert(records).execute()
        return len(records)
    except Exception as e:
        print(f"  Error uploading chunk: {e}")
        return 0

def process_file(supabase, file_path: str, batch_id: str) -> int:
    """Process a single file and upload its contents"""
    filename = os.path.basename(file_path)
    print(f"\n📁 Processing: {filename}")
    
    # Determine file type and read accordingly
    if filename.lower().endswith('.csv'):
        rows = read_csv_file(file_path)
    elif filename.lower().endswith(('.xlsx', '.xls')):
        rows = read_excel_file(file_path)
    else:
        print(f"  ⚠️  Skipping unsupported file: {filename}")
        return 0
    
    if not rows:
        print(f"  ⚠️  No data found in {filename}")
        return 0
    
    print(f"  📊 Found {len(rows)} rows")
    
    # Upload in chunks
    uploaded_count = 0
    for i in range(0, len(rows), CHUNK_SIZE):
        chunk = rows[i:i + CHUNK_SIZE]
        chunk_uploaded = upload_chunk(supabase, batch_id, filename, chunk)
        uploaded_count += chunk_uploaded
        
        progress = min(i + CHUNK_SIZE, len(rows))
        print(f"  ⬆️  Uploaded {progress}/{len(rows)} rows")
    
    print(f"  ✅ Successfully uploaded {uploaded_count} rows from {filename}")
    return uploaded_count

def main():
    """Main uploader function"""
    print("🚀 Business Data Uploader Starting...")
    print(f"📂 Scanning folder: {DATA_FOLDER}")
    
    # Check if folder exists
    if not os.path.exists(DATA_FOLDER):
        print(f"❌ Error: Folder {DATA_FOLDER} does not exist")
        return
    
    # Initialize Supabase
    try:
        supabase = initialize_supabase()
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {e}")
        return
    
    # Generate batch ID
    batch_id = str(uuid.uuid4())
    print(f"🆔 Batch ID: {batch_id}")
    
    # Get all supported files
    supported_files = []
    for filename in os.listdir(DATA_FOLDER):
        file_path = os.path.join(DATA_FOLDER, filename)
        if os.path.isfile(file_path):
            if filename.lower().endswith(('.csv', '.xlsx', '.xls')):
                supported_files.append(file_path)
    
    if not supported_files:
        print("❌ No CSV or Excel files found in the folder")
        return
    
    print(f"📋 Found {len(supported_files)} files to process")
    
    # Process each file
    total_uploaded = 0
    for file_path in supported_files:
        uploaded = process_file(supabase, file_path, batch_id)
        total_uploaded += uploaded
    
    print(f"\n🎉 Upload Complete!")
    print(f"📊 Total rows uploaded: {total_uploaded}")
    print(f"🆔 Batch ID: {batch_id}")

if __name__ == "__main__":
    main()
