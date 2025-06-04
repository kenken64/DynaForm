#!/usr/bin/env python3
"""
Comprehensive PDF Metadata Extraction Demo

This script demonstrates how to extract various metadata from PDF files including:
- Title, Author, Subject
- Creator and Producer applications  
- Creation and modification dates
- Page count
- And more...

Usage: python pdf_metadata_demo.py [pdf_file_path]
"""

import os
import sys
import io
import PyPDF2
from datetime import datetime
import json

def extract_pdf_metadata(pdf_file_path):
    """Extract comprehensive metadata from a PDF file"""
    
    print(f"\n{'='*80}")
    print(f"EXTRACTING METADATA FROM: {os.path.basename(pdf_file_path)}")
    print(f"File path: {pdf_file_path}")
    print(f"{'='*80}")
    
    try:
        with open(pdf_file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            metadata = pdf_reader.metadata
            
            if not metadata:
                print("❌ No metadata found in this PDF")
                return None
            
            # Extract all available metadata
            extracted_metadata = {}
            
            # Standard metadata fields
            standard_fields = {
                '/Title': 'title',
                '/Author': 'author', 
                '/Subject': 'subject',
                '/Creator': 'creator',
                '/Producer': 'producer',
                '/Keywords': 'keywords'
            }
            
            for pdf_key, readable_key in standard_fields.items():
                if pdf_key in metadata and metadata[pdf_key]:
                    extracted_metadata[readable_key] = metadata[pdf_key]
            
            # Handle date fields specially
            date_fields = {
                '/CreationDate': 'creation_date',
                '/ModDate': 'modification_date'
            }
            
            for pdf_date_key, readable_date_key in date_fields.items():
                if pdf_date_key in metadata and metadata[pdf_date_key]:
                    date_value = metadata[pdf_date_key]
                    try:
                        # PDF dates are in format D:YYYYMMDDHHmmSSOHH'mm'
                        if str(date_value).startswith('D:'):
                            date_str = str(date_value)[2:16]  # Extract YYYYMMDDHHMMSS
                            parsed_date = datetime.strptime(date_str, '%Y%m%d%H%M%S')
                            extracted_metadata[readable_date_key] = parsed_date.isoformat()
                            extracted_metadata[readable_date_key + '_formatted'] = parsed_date.strftime('%Y-%m-%d %H:%M:%S')
                        else:
                            extracted_metadata[readable_date_key] = str(date_value)
                    except Exception as e:
                        extracted_metadata[readable_date_key] = str(date_value)
                        print(f"⚠️  Could not parse date {pdf_date_key}: {e}")
            
            # Add page count
            extracted_metadata['page_count'] = len(pdf_reader.pages)
            
            # Add file size
            file_size = os.path.getsize(pdf_file_path)
            extracted_metadata['file_size_bytes'] = file_size
            extracted_metadata['file_size_mb'] = round(file_size / (1024 * 1024), 2)
            
            # Display results
            print("\n📋 METADATA FOUND:")
            print("-" * 60)
            
            for key, value in extracted_metadata.items():
                if key.endswith('_formatted'):
                    continue  # Skip formatted dates in main display
                display_key = key.replace('_', ' ').title()
                print(f"  {display_key:20}: {value}")
            
            # Show all raw metadata for debugging
            print(f"\n🔍 RAW METADATA (for debugging):")
            print("-" * 60)
            for key, value in metadata.items():
                print(f"  {key:20}: {value}")
            
            return extracted_metadata
            
    except FileNotFoundError:
        print(f"❌ File not found: {pdf_file_path}")
        return None
    except Exception as e:
        print(f"❌ Error processing PDF: {e}")
        return None

def demo_with_multiple_files():
    """Demonstrate metadata extraction with multiple PDF files"""
    
    # List of PDF files to test
    test_files = [
        '/Users/kennethphang/Projects/doc2formjson/data/Sample-Fillable-PDF.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/medical_form.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/sampleform.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/bankers-guarantee-extension.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/UOB Debt Relief Plan Application Form_Kenneth Phang.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/StudentForm.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/ltsvp_form14.pdf'
    ]
    
    print("🚀 PDF METADATA EXTRACTION DEMO")
    print("This demo will extract metadata from available PDF files\n")
    
    results = []
    processed_count = 0
    
    for pdf_file in test_files:
        if os.path.exists(pdf_file):
            metadata = extract_pdf_metadata(pdf_file)
            if metadata:
                results.append({
                    'file': os.path.basename(pdf_file),
                    'metadata': metadata
                })
            processed_count += 1
            
            if processed_count >= 5:  # Limit to first 5 files
                break
    
    if not results:
        print("❌ No PDF files found or processed successfully")
        return
    
    # Summary
    print(f"\n{'='*80}")
    print(f"📊 SUMMARY - Processed {len(results)} PDF files:")
    print(f"{'='*80}")
    
    for result in results:
        file_name = result['file']
        metadata = result['metadata']
        
        title = metadata.get('title', 'No title')
        author = metadata.get('author', 'No author')
        pages = metadata.get('page_count', 'Unknown')
        created = metadata.get('creation_date_formatted', metadata.get('creation_date', 'Unknown'))
        
        print(f"📄 {file_name}")
        print(f"   Title: {title}")
        print(f"   Author: {author}")
        print(f"   Pages: {pages}")
        print(f"   Created: {created}")
        print()
    
    # Save results to JSON
    output_file = '/Users/kennethphang/Projects/doc2formjson/pdf-png/metadata_results.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"💾 Full results saved to: {output_file}")

def main():
    """Main function"""
    
    if len(sys.argv) > 1:
        # Process specific file
        pdf_file = sys.argv[1]
        if os.path.exists(pdf_file):
            extract_pdf_metadata(pdf_file)
        else:
            print(f"❌ File not found: {pdf_file}")
    else:
        # Demo with multiple files
        demo_with_multiple_files()

if __name__ == "__main__":
    main()
