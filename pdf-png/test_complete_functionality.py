#!/usr/bin/env python3
"""
Complete test of PDF metadata extraction and hash generation functionality
"""
import requests
import os
import json

def test_metadata_extraction():
    """Test PDF metadata extraction via Flask API"""
    
    # Test with the sample PDF
    pdf_path = "/Users/kennethphang/Projects/doc2formjson/data/Sample-Fillable-PDF.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"Error: Test PDF not found at {pdf_path}")
        return
    
    # Start Flask server first
    print("Starting Flask server for testing...")
    
    # Test the metadata endpoint
    url = "http://localhost:5001/conversion/pdf-metadata"
    
    try:
        with open(pdf_path, 'rb') as f:
            files = {'pdfFile': ('test.pdf', f, 'application/pdf')}
            response = requests.post(url, files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Metadata extraction successful!")
            print("\n" + "="*60)
            print("EXTRACTED METADATA:")
            print("="*60)
            
            metadata = result.get('metadata', {})
            for key, value in metadata.items():
                if key != 'hashes':
                    print(f"{key.replace('_', ' ').title()}: {value}")
            
            # Print hashes
            if 'hashes' in metadata:
                print("\nGENERATED HASHES:")
                print("-" * 30)
                hashes = metadata['hashes']
                for hash_type, hash_value in hashes.items():
                    print(f"{hash_type.upper()}: {hash_value}")
                print("-" * 30)
            
            print(f"\n✅ Hash generation successful! Generated {len(metadata.get('hashes', {}))} different hash types")
            
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Flask server. Make sure it's running on port 5001")
    except Exception as e:
        print(f"❌ Error during test: {e}")

def test_local_functionality():
    """Test the functionality directly without Flask server"""
    print("\n" + "="*60)
    print("TESTING LOCAL FUNCTIONALITY (WITHOUT FLASK SERVER)")
    print("="*60)
    
    # Import the functions directly
    import sys
    sys.path.append('/Users/kennethphang/Projects/doc2formjson/pdf-png')
    
    try:
        from app import extract_pdf_metadata, generate_metadata_hash
        
        # Test with sample PDF
        pdf_path = "/Users/kennethphang/Projects/doc2formjson/data/Sample-Fillable-PDF.pdf"
        
        if os.path.exists(pdf_path):
            with open(pdf_path, 'rb') as f:
                pdf_bytes = f.read()
            
            # Extract metadata
            metadata = extract_pdf_metadata(pdf_bytes)
            
            print("✅ Local metadata extraction successful!")
            print(f"✅ Generated {len(metadata.get('hashes', {}))} hash types")
            
            # Test hash generation with sample data
            sample_metadata = {
                'title': 'Test Document',
                'creator': 'Test Creator',
                'producer': 'Test Producer',
                'creation_date': '2024-01-01T12:00:00',
                'modification_date': '2024-01-01T12:00:00'
            }
            
            hashes = generate_metadata_hash(sample_metadata)
            print(f"✅ Direct hash generation test successful! Generated {len(hashes)} hash types")
            
        else:
            print(f"❌ Test PDF not found at {pdf_path}")
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
    except Exception as e:
        print(f"❌ Error in local test: {e}")

if __name__ == "__main__":
    print("PDF METADATA EXTRACTION AND HASH GENERATION TEST")
    print("=" * 60)
    
    # Test local functionality first
    test_local_functionality()
    
    print("\n" + "="*60)
    print("TESTING VIA FLASK API")
    print("="*60)
    print("Note: Start the Flask server with 'python app.py' in another terminal")
    print("Then run this test again to test the API endpoints")
    
    # Try to test API (will show connection error if server not running)
    test_metadata_extraction()
