#!/usr/bin/env python3
"""
Test hash generation functionality specifically
"""
import sys
import os
sys.path.append('/Users/kennethphang/Projects/doc2formjson/pdf-png')

import hashlib
import json
from datetime import datetime

def generate_metadata_hash(metadata):
    """Generate various hashes from PDF metadata"""
    hashes = {}
    
    # Create a concatenated string of key metadata fields
    hash_fields = ['title', 'creator', 'producer', 'creation_date', 'modification_date']
    hash_string = ""
    
    for field in hash_fields:
        if field in metadata and metadata[field]:
            hash_string += str(metadata[field])
    
    if hash_string:
        # Generate different types of hashes
        hashes['md5'] = hashlib.md5(hash_string.encode('utf-8')).hexdigest()
        hashes['sha1'] = hashlib.sha1(hash_string.encode('utf-8')).hexdigest()
        hashes['sha256'] = hashlib.sha256(hash_string.encode('utf-8')).hexdigest()
        
        # Create a short identifier (first 8 chars of SHA256)
        hashes['short_id'] = hashes['sha256'][:8]
        
        # Create a fingerprint combining key fields
        fingerprint_data = {
            'title': metadata.get('title', ''),
            'creator': metadata.get('creator', ''),
            'producer': metadata.get('producer', ''),
            'creation_date': metadata.get('creation_date', ''),
            'modification_date': metadata.get('modification_date', '')
        }
        
        fingerprint_json = json.dumps(fingerprint_data, sort_keys=True)
        hashes['fingerprint'] = hashlib.sha256(fingerprint_json.encode('utf-8')).hexdigest()
        
        print(f"Generated hashes for metadata:")
        print(f"  MD5: {hashes['md5']}")
        print(f"  SHA1: {hashes['sha1']}")
        print(f"  SHA256: {hashes['sha256']}")
        print(f"  Short ID: {hashes['short_id']}")
        print(f"  Fingerprint: {hashes['fingerprint']}")
    else:
        hashes['message'] = 'No hashable metadata found'
    
    return hashes

def test_hash_generation():
    """Test hash generation with sample metadata"""
    
    # Sample metadata like the one you provided
    sample_metadata = {
        'title': 'Microsoft Word - Sample Fillable Word Document.docx',
        'creator': 'Word',
        'producer': 'Acrobat PDFMaker 15 for Word',
        'creation_date': '2017-12-07T18:27:21',
        'modification_date': '2017-12-20T10:25:20',
        'page_count': 1
    }
    
    print("=" * 80)
    print("TESTING HASH GENERATION WITH SAMPLE METADATA")
    print("=" * 80)
    
    print("\nSample Metadata:")
    print("-" * 40)
    for key, value in sample_metadata.items():
        print(f"  {key}: {value}")
    
    print(f"\n{'='*50}")
    print("GENERATING HASHES...")
    print(f"{'='*50}")
    
    # Generate hashes
    hashes = generate_metadata_hash(sample_metadata)
    
    print(f"\n{'='*50}")
    print("HASH RESULTS:")
    print(f"{'='*50}")
    
    for hash_type, hash_value in hashes.items():
        print(f"  {hash_type.upper()}: {hash_value}")
    
    # Test with another sample
    print(f"\n{'='*80}")
    print("TESTING WITH ANOTHER SAMPLE (PDF Form Example)")
    print(f"{'='*80}")
    
    sample_metadata_2 = {
        'title': 'PDF Form Example',
        'creator': 'Writer',
        'producer': 'OpenOffice.org 3.4',
        'creation_date': '2013-06-29T20:48:53',
        'modification_date': '2024-06-24T14:40:05',
        'page_count': 1
    }
    
    print("\nSample Metadata 2:")
    print("-" * 40)
    for key, value in sample_metadata_2.items():
        print(f"  {key}: {value}")
    
    print(f"\n{'='*50}")
    print("GENERATING HASHES...")
    print(f"{'='*50}")
    
    hashes_2 = generate_metadata_hash(sample_metadata_2)
    
    print(f"\n{'='*50}")
    print("HASH RESULTS 2:")
    print(f"{'='*50}")
    
    for hash_type, hash_value in hashes_2.items():
        print(f"  {hash_type.upper()}: {hash_value}")
    
    # Compare hashes
    print(f"\n{'='*80}")
    print("HASH COMPARISON:")
    print(f"{'='*80}")
    
    print("MD5 comparison:")
    print(f"  Sample 1: {hashes.get('md5', 'N/A')}")
    print(f"  Sample 2: {hashes_2.get('md5', 'N/A')}")
    print(f"  Same? {hashes.get('md5') == hashes_2.get('md5')}")
    
    print("\nSHA256 comparison:")
    print(f"  Sample 1: {hashes.get('sha256', 'N/A')}")
    print(f"  Sample 2: {hashes_2.get('sha256', 'N/A')}")
    print(f"  Same? {hashes.get('sha256') == hashes_2.get('sha256')}")

if __name__ == "__main__":
    test_hash_generation()
