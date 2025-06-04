#!/usr/bin/env python3
"""
Test the Flask app's metadata extraction with hash generation
"""
import sys
import os
sys.path.append('/Users/kennethphang/Projects/doc2formjson/pdf-png')

from app import extract_pdf_metadata

def test_flask_app_metadata():
    """Test the Flask app's metadata extraction function with real PDF files"""
    
    # Test with one of the available PDF files
    pdf_files = [
        '/Users/kennethphang/Projects/doc2formjson/data/Sample-Fillable-PDF.pdf',
        '/Users/kennethphang/Projects/doc2formjson/data/sampleform.pdf'
    ]
    
    for pdf_file in pdf_files:
        if os.path.exists(pdf_file):
            print(f"\n{'='*80}")
            print(f"TESTING FLASK APP WITH: {os.path.basename(pdf_file)}")
            print(f"{'='*80}")
            
            try:
                with open(pdf_file, 'rb') as f:
                    pdf_bytes = f.read()
                    metadata = extract_pdf_metadata(pdf_bytes)
                    
                print("\n📋 COMPLETE METADATA RESULT:")
                print("-" * 60)
                
                if isinstance(metadata, dict) and 'error' not in metadata:
                    for key, value in metadata.items():
                        if key == 'hashes':
                            print(f"\n🔐 HASHES:")
                            for hash_type, hash_value in value.items():
                                print(f"    {hash_type.upper()}: {hash_value}")
                        else:
                            print(f"  {key.replace('_', ' ').title()}: {value}")
                else:
                    print("❌ No metadata found or error occurred")
                    print(metadata)
                    
            except Exception as e:
                print(f"❌ Error processing {pdf_file}: {e}")
                
            break  # Test only the first available file

if __name__ == "__main__":
    test_flask_app_metadata()
