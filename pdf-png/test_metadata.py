#!/usr/bin/env python3
import sys
import os
sys.path.append('/Users/kennethphang/Projects/doc2formjson/pdf-png')

from app import extract_pdf_metadata

def test_metadata_extraction():
    # Test with one of the available PDF files
    pdf_files = [
        '/Users/kennethphang/Projects/doc2formjson/data/Sample-Fillable-PDF.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/medical_form.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/sampleform.pdf'
    ]
    
    for pdf_file in pdf_files:
        if os.path.exists(pdf_file):
            print(f"\n\n{'='*60}")
            print(f"TESTING PDF: {os.path.basename(pdf_file)}")
            print(f"{'='*60}")
            
            try:
                with open(pdf_file, 'rb') as f:
                    pdf_bytes = f.read()
                    metadata = extract_pdf_metadata(pdf_bytes)
                    
                print("\nMETADATA RESULT:")
                print("-" * 40)
                if isinstance(metadata, dict):
                    for key, value in metadata.items():
                        print(f"{key}: {value}")
                else:
                    print("No metadata found or error occurred")
                    
            except Exception as e:
                print(f"Error processing {pdf_file}: {e}")
            
            break  # Test only the first available file
    else:
        print("No PDF files found in the data directory")

if __name__ == "__main__":
    test_metadata_extraction()
