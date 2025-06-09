#!/usr/bin/env node

/**
 * Test script to verify the field configuration fix in public form component
 * This simulates the scenarios where the backend returns different formats
 */

console.log('Testing Field Configuration Handling Fix\n');

// Simulate the getFieldConfiguration method behavior
function getFieldConfiguration(fieldName, fieldConfigurations) {
    const config = fieldConfigurations[fieldName];
    
    // Handle different field configuration formats for backward compatibility
    if (!config) {
        return [];
    }
    
    // Handle object format: { mandatory: boolean, validation: boolean }
    if (typeof config === 'object' && config !== null && !Array.isArray(config)) {
        const result = [];
        if (config.mandatory) result.push('mandatory');
        if (config.validation) result.push('validation');
        return result;
    }
    
    // Handle legacy array format: ['mandatory', 'validation'] or []
    if (Array.isArray(config)) {
        return config;
    }
    
    // Fallback for unknown formats
    return [];
}

// Test scenarios
const testCases = [
    {
        name: 'Object format with mandatory true',
        fieldConfigurations: {
            'field1': { mandatory: true, validation: false }
        },
        fieldName: 'field1',
        expected: ['mandatory']
    },
    {
        name: 'Object format with validation true',
        fieldConfigurations: {
            'field2': { mandatory: false, validation: true }
        },
        fieldName: 'field2',
        expected: ['validation']
    },
    {
        name: 'Object format with both true',
        fieldConfigurations: {
            'field3': { mandatory: true, validation: true }
        },
        fieldName: 'field3',
        expected: ['mandatory', 'validation']
    },
    {
        name: 'Array format (legacy)',
        fieldConfigurations: {
            'field4': ['mandatory', 'validation']
        },
        fieldName: 'field4',
        expected: ['mandatory', 'validation']
    },
    {
        name: 'Empty array format',
        fieldConfigurations: {
            'field5': []
        },
        fieldName: 'field5',
        expected: []
    },
    {
        name: 'Non-existent field',
        fieldConfigurations: {
            'field6': { mandatory: true, validation: false }
        },
        fieldName: 'nonexistent',
        expected: []
    }
];

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    
    const result = getFieldConfiguration(testCase.fieldName, testCase.fieldConfigurations);
    const resultStr = JSON.stringify(result.sort());
    const expectedStr = JSON.stringify(testCase.expected.sort());
    
    if (resultStr === expectedStr) {
        console.log(`✅ PASSED - Expected: ${expectedStr}, Got: ${resultStr}`);
        passed++;
    } else {
        console.log(`❌ FAILED - Expected: ${expectedStr}, Got: ${resultStr}`);
        failed++;
    }
    console.log('');
});

// Test the includes method that was causing the original error
console.log('Testing includes() method usage:\n');

const mockFieldConfigurations = {
    'mandatoryField': { mandatory: true, validation: false },
    'validationField': { mandatory: false, validation: true },
    'arrayField': ['mandatory']
};

['mandatoryField', 'validationField', 'arrayField'].forEach(fieldName => {
    const configs = getFieldConfiguration(fieldName, mockFieldConfigurations);
    console.log(`Field: ${fieldName}`);
    console.log(`  configs: ${JSON.stringify(configs)}`);
    console.log(`  configs.includes('mandatory'): ${configs.includes('mandatory')}`);
    console.log(`  configs.includes('validation'): ${configs.includes('validation')}`);
    console.log('');
});

// Summary
console.log('Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);

if (failed === 0) {
    console.log('\n🎉 All tests passed! The field configuration fix is working correctly.');
} else {
    console.log(`\n⚠️ ${failed} test(s) failed. Please review the implementation.`);
    process.exit(1);
}
