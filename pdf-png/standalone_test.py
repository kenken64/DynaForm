#!/usr/bin/env python3
import os
import io
import PyPDF2
from datetime import datetime

def extract_pdf_metadata(pdf_bytes):
    """Extract metadata from PDF bytes"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        metadata = pdf_reader.metadata
        
        if not metadata:
            print("No metadata found in PDF")
            return {"message": "No metadata found in PDF"}
        
        # Extract common metadata fields
        extracted_metadata = {}
        
        # Title
        if '/Title' in metadata:
            extracted_metadata['title'] = metadata['/Title']
        
        # Author
        if '/Author' in metadata:
            extracted_metadata['author'] = metadata['/Author']
        
        # Subject
        if '/Subject' in metadata:
            extracted_metadata['subject'] = metadata['/Subject']
        
        # Creator (application that created the PDF)
        if '/Creator' in metadata:
            extracted_metadata['creator'] = metadata['/Creator']
        
        # Producer (application that produced the PDF)
        if '/Producer' in metadata:
            extracted_metadata['producer'] = metadata['/Producer']
        
        # Creation date
        if '/CreationDate' in metadata:
            creation_date = metadata['/CreationDate']
            try:
                # PDF dates are in format D:YYYYMMDDHHmmSSOHH'mm'
                if creation_date.startswith('D:'):
                    date_str = creation_date[2:16]  # Extract YYYYMMDDHHMMSS
                    parsed_date = datetime.strptime(date_str, '%Y%m%d%H%M%S')
                    extracted_metadata['creation_date'] = parsed_date.isoformat()
                else:
                    extracted_metadata['creation_date'] = str(creation_date)
            except:
                extracted_metadata['creation_date'] = str(creation_date)
        
        # Modification date
        if '/ModDate' in metadata:
            mod_date = metadata['/ModDate']
            try:
                if mod_date.startswith('D:'):
                    date_str = mod_date[2:16]  # Extract YYYYMMDDHHMMSS
                    parsed_date = datetime.strptime(date_str, '%Y%m%d%H%M%S')
                    extracted_metadata['modification_date'] = parsed_date.isoformat()
                else:
                    extracted_metadata['modification_date'] = str(mod_date)
            except:
                extracted_metadata['modification_date'] = str(mod_date)
        
        # Additional info
        extracted_metadata['page_count'] = len(pdf_reader.pages)
        
        # Print metadata to console
        print("=" * 50)
        print("PDF METADATA EXTRACTED:")
        print("=" * 50)
        for key, value in extracted_metadata.items():
            print(f"{key.replace('_', ' ').title()}: {value}")
        print("=" * 50)
        
        return extracted_metadata
        
    except Exception as e:
        print(f"Error extracting PDF metadata: {e}")
        return {"error": f"Failed to extract metadata: {str(e)}"}

def test_metadata_extraction():
    # Test with available PDF files
    pdf_files = [
        '/Users/kennethphang/Projects/doc2formjson/data/Sample-Fillable-PDF.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/medical_form.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/sampleform.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/bankers-guarantee-extension.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/UOB Debt Relief Plan Application Form_Kenneth Phang.pdf'
    ]
    
    tested_files = 0
    for pdf_file in pdf_files:
        if os.path.exists(pdf_file):
            print(f"\n\n{'='*60}")
            print(f"TESTING PDF: {os.path.basename(pdf_file)}")
            print(f"File path: {pdf_file}")
            print(f"{'='*60}")
            
            try:
                with open(pdf_file, 'rb') as f:
                    pdf_bytes = f.read()
                    metadata = extract_pdf_metadata(pdf_bytes)
                    
                print("\nMETADATA RESULT:")
                print("-" * 40)
                if isinstance(metadata, dict) and 'error' not in metadata:
                    for key, value in metadata.items():
                        print(f"{key}: {value}")
                else:
                    print("No metadata found or error occurred")
                    print(metadata)
                    
            except Exception as e:
                print(f"Error processing {pdf_file}: {e}")
            
            tested_files += 1
            if tested_files >= 3:  # Test first 3 available files
                break
    
    if tested_files == 0:
        print("No PDF files found in the data directory")
        print("Available files in data directory:")
        data_dir = '/Users/kennethphang/Projects/doc2formjson/data'
        if os.path.exists(data_dir):
            for f in os.listdir(data_dir):
                if f.endswith('.pdf'):
                    print(f"  - {f}")

if __name__ == "__main__":
    test_metadata_extraction()
