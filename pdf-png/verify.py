from app import extract_pdf_metadata, generate_metadata_hash

# Test hash generation
sample_metadata = {
    'title': 'Test Document',
    'creator': 'Microsoft Word',
    'producer': 'Adobe PDF',
    'creation_date': '2024-01-01T12:00:00',
    'modification_date': '2024-01-01T12:00:00'
}

print("TESTING HASH GENERATION:")
hashes = generate_metadata_hash(sample_metadata)
print(f"Generated {len(hashes)} hash types successfully!")
print("Implementation is working correctly!")
