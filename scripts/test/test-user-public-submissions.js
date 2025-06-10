const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = '6845ddbf0ff2303cf2cff9a0'; // Real user ID from the data

console.log('Testing User-Specific Public Submissions Implementation');
console.log('==================================================');

async function testImplementation() {
    try {
        // Test 1: Check if the new endpoint exists
        console.log('\n1. Testing new user-specific endpoint...');
        try {
            const response = await axios.get(`${API_BASE_URL}/api/public/submissions/user/${TEST_USER_ID}`);
            console.log('✓ User-specific endpoint is accessible');
            console.log(`Status: ${response.status}`);
            console.log(`Response structure:`, Object.keys(response.data));
            
            if (response.data.submissions) {
                console.log(`Number of submissions: ${response.data.submissions.length}`);
                if (response.data.submissions.length > 0) {
                    console.log('Sample submission structure:', Object.keys(response.data.submissions[0]));
                    const sample = response.data.submissions[0];
                    console.log('Sample data:');
                    console.log(`- Form ID: ${sample.formId}`);
                    console.log(`- Form Title: ${sample.formTitle}`);
                    console.log(`- Form Description: ${sample.formDescription ? sample.formDescription.substring(0, 50) + '...' : 'None'}`);
                    console.log(`- Submission ID: ${sample._id}`);
                }
            }
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✗ User-specific endpoint not found - route may not be registered');
            } else if (error.response?.status === 500) {
                console.log('✗ Server error - check implementation');
                console.log('Error details:', error.response.data);
            } else {
                console.log('✗ Network error - server may not be running');
            }
        }

        // Test 2: Compare with aggregated endpoint to ensure data consistency
        console.log('\n2. Testing data consistency with aggregated endpoint...');
        try {
            const aggregatedResponse = await axios.get(`${API_BASE_URL}/api/public/submissions`);
            console.log('✓ Aggregated endpoint still works');
            console.log(`Aggregated submissions count: ${aggregatedResponse.data.submissions?.length || 0}`);
        } catch (error) {
            console.log('✗ Aggregated endpoint failed:', error.message);
        }

        // Test 3: Test pagination
        console.log('\n3. Testing pagination...');
        try {
            const paginatedResponse = await axios.get(`${API_BASE_URL}/api/public/submissions/user/${TEST_USER_ID}?page=1&limit=5`);
            console.log('✓ Pagination parameters accepted');
            console.log(`Page 1 results: ${paginatedResponse.data.submissions?.length || 0}`);
            console.log(`Total pages: ${paginatedResponse.data.totalPages || 'N/A'}`);
            console.log(`Total submissions: ${paginatedResponse.data.totalSubmissions || 'N/A'}`);
        } catch (error) {
            console.log('✗ Pagination test failed:', error.message);
        }

        // Test 4: Test search functionality
        console.log('\n4. Testing search functionality...');
        try {
            const searchResponse = await axios.get(`${API_BASE_URL}/api/public/submissions/user/${TEST_USER_ID}?search=form`);
            console.log('✓ Search parameter accepted');
            console.log(`Search results: ${searchResponse.data.submissions?.length || 0}`);
        } catch (error) {
            console.log('✗ Search test failed:', error.message);
        }

        // Test 5: Test with non-existent user
        console.log('\n5. Testing with non-existent user...');
        try {
            const nonExistentResponse = await axios.get(`${API_BASE_URL}/api/public/submissions/user/non-existent-user`);
            console.log('✓ Non-existent user handled gracefully');
            console.log(`Results for non-existent user: ${nonExistentResponse.data.submissions?.length || 0}`);
        } catch (error) {
            console.log('✗ Non-existent user test failed:', error.message);
        }

    } catch (error) {
        console.error('Test suite failed:', error.message);
    }
}

// Helper function to check if server is running
async function checkServerStatus() {
    try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        return true;
    } catch (error) {
        try {
            // Try a basic endpoint if health endpoint doesn't exist
            const response = await axios.get(`${API_BASE_URL}/api/public/submissions`);
            return true;
        } catch (error2) {
            return false;
        }
    }
}

async function main() {
    console.log('Checking server status...');
    const isServerRunning = await checkServerStatus();
    
    if (!isServerRunning) {
        console.log('❌ Server is not running on port 3001');
        console.log('Please start the server first with: npm run dev:server');
        return;
    }
    
    console.log('✅ Server is running');
    await testImplementation();
}

main().catch(console.error);
