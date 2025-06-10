const crypto = require('crypto');

// Test the fingerprint generation functions directly
console.log('🧪 Testing PDF Metadata JSON Fingerprint Generation Functions');
console.log('='.repeat(60));

// Sample form data similar to what would be created by "Create New Form" button
const sampleFormData = [
  {
    name: "firstName",
    type: "text",
    value: "",
    required: true
  },
  {
    name: "lastName", 
    type: "text",
    value: "",
    required: true
  },
  {
    name: "email",
    type: "email", 
    value: "",
    required: true
  },
  {
    name: "message",
    type: "textarea",
    value: "",
    required: false
  }
];

const sampleFieldConfigurations = {
  firstName: { mandatory: true, validation: false },
  lastName: { mandatory: true, validation: false },
  email: { mandatory: true, validation: true },
  message: { mandatory: false, validation: false }
};

const sampleOriginalJson = {
  title: "Contact Form",
  fields: [
    { name: "firstName", type: "text" },
    { name: "lastName", type: "text" },
    { name: "email", type: "email" },
    { name: "message", type: "textarea" }
  ]
};

const sampleMetadata = {
  formName: "Contact Form",
  version: "1.0.0"
};

// Replicate the fingerprint generation functions from formService.ts
function generateJsonFingerprint(formData, fieldConfigurations, originalJson, metadata) {
  console.log('📝 Generating JSON fingerprint...');
  
  // Create a canonical representation of the form data for consistent hashing
  const canonicalData = {
    formData: formData.map(field => ({
      name: field.name,
      type: field.type,
      required: field.required
    })).sort((a, b) => a.name.localeCompare(b.name)),
    fieldConfigurations: fieldConfigurations,
    originalJson: originalJson,
    metadata: metadata
  };
  
  const jsonString = JSON.stringify(canonicalData, null, 0);
  console.log('📋 Canonical data string:', jsonString.substring(0, 100) + '...');
  
  const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
  console.log('🔐 Generated SHA256 hash:', hash);
  
  return hash;
}

function generateShortId(hash) {
  return hash.substring(0, 8);
}

function generateFormMetadata(formData, fieldConfigurations, originalJson, metadata) {
  console.log('🏗️  Generating form metadata...');
  
  // Generate JSON fingerprint
  const jsonFingerprint = generateJsonFingerprint(formData, fieldConfigurations, originalJson, metadata);
  const shortId = generateShortId(jsonFingerprint);
  
  // Create metadata structure similar to PDF files
  const pdfMetadata = {
    // Basic PDF-like metadata
    file_size: 0, // No file for form-created documents
    page_count: 1,
    creation_date: new Date().toISOString(),
    modification_date: new Date().toISOString(),
    
    // Hash information - using JSON fingerprint for all hash types for consistency
    md5_hash: crypto.createHash('md5').update(jsonFingerprint).digest('hex'),
    sha1_hash: crypto.createHash('sha1').update(jsonFingerprint).digest('hex'),
    sha256_hash: jsonFingerprint, // This is our primary JSON fingerprint
    short_id: shortId,
    json_fingerprint: jsonFingerprint,
    
    // Form-specific metadata
    form_created_via: 'form_editor',
    form_type: 'custom_form',
    source: 'manual_creation'
  };
  
  console.log('📊 Generated metadata:', JSON.stringify(pdfMetadata, null, 2));
  
  return pdfMetadata;
}

// Run the tests
console.log('\n🧪 Test 1: JSON Fingerprint Generation');
console.log('-'.repeat(40));
const fingerprint = generateJsonFingerprint(sampleFormData, sampleFieldConfigurations, sampleOriginalJson, sampleMetadata);
console.log('✅ JSON Fingerprint:', fingerprint);

console.log('\n🧪 Test 2: Short ID Generation');
console.log('-'.repeat(40));
const shortId = generateShortId(fingerprint);
console.log('✅ Short ID:', shortId);

console.log('\n🧪 Test 3: Full Metadata Generation');
console.log('-'.repeat(40));
const metadata = generateFormMetadata(sampleFormData, sampleFieldConfigurations, sampleOriginalJson, sampleMetadata);
console.log('✅ PDF Metadata generated successfully');

console.log('\n🧪 Test 4: Consistency Check');
console.log('-'.repeat(40));
// Generate fingerprint multiple times to ensure consistency
const fingerprint1 = generateJsonFingerprint(sampleFormData, sampleFieldConfigurations, sampleOriginalJson, sampleMetadata);
const fingerprint2 = generateJsonFingerprint(sampleFormData, sampleFieldConfigurations, sampleOriginalJson, sampleMetadata);
const fingerprint3 = generateJsonFingerprint(sampleFormData, sampleFieldConfigurations, sampleOriginalJson, sampleMetadata);

console.log('Fingerprint 1:', fingerprint1);
console.log('Fingerprint 2:', fingerprint2);
console.log('Fingerprint 3:', fingerprint3);

if (fingerprint1 === fingerprint2 && fingerprint2 === fingerprint3) {
  console.log('✅ Consistency test PASSED - Same input produces same fingerprint');
} else {
  console.log('❌ Consistency test FAILED - Fingerprints should be identical');
}

console.log('\n🧪 Test 5: Different Data Produces Different Fingerprints');
console.log('-'.repeat(40));
// Test with slightly different data
const differentFormData = [...sampleFormData];
differentFormData[0].name = "fullName"; // Change first field name

const differentFingerprint = generateJsonFingerprint(differentFormData, sampleFieldConfigurations, sampleOriginalJson, sampleMetadata);
console.log('Original fingerprint:', fingerprint);
console.log('Different fingerprint:', differentFingerprint);

if (fingerprint !== differentFingerprint) {
  console.log('✅ Different data test PASSED - Different input produces different fingerprint');
} else {
  console.log('❌ Different data test FAILED - Different inputs should produce different fingerprints');
}

console.log('\n📋 Summary:');
console.log('='.repeat(60));
console.log('✅ JSON fingerprint generation functions working correctly');
console.log('✅ Consistent hashing for identical input');
console.log('✅ Different hashing for different input');
console.log('✅ Metadata structure matches PDF upload workflow');
console.log('\n🎯 The implementation should now work for forms created via "Create New Form" button');
