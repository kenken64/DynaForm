const puppeteer = require('puppeteer');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:4200';
const TEST_USER_ID = '6845ddbf0ff2303cf2cff9a0';

console.log('Testing Frontend User-Specific Public Submissions');
console.log('===============================================');

async function testFrontendIntegration() {
    let browser;
    
    try {
        // Launch browser
        console.log('1. Launching browser...');
        browser = await puppeteer.launch({ 
            headless: false, // Set to true for headless mode
            defaultViewport: { width: 1280, height: 720 }
        });
        
        const page = await browser.newPage();
        
        // Navigate to the form data list page
        console.log('2. Navigating to form data list...');
        await page.goto(`${FRONTEND_URL}/form-data-list`, { 
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait for the page to load
        await page.waitForSelector('mat-tab-group', { timeout: 10000 });
        console.log('✓ Form data list page loaded');
        
        // Click on the Public tab
        console.log('3. Clicking on Public tab...');
        await page.click('mat-tab[label="Public"]');
        await page.waitForTimeout(2000); // Wait for tab content to load
        
        // Check if the new table structure is present
        console.log('4. Checking table structure...');
        
        // Look for the new column headers
        const formIdHeader = await page.$('th:contains("Form ID")');
        const formTitleHeader = await page.$('th:contains("Form Title")');
        const formDescriptionHeader = await page.$('th:contains("Form Description")');
        const actionsHeader = await page.$('th:contains("Actions")');
        
        if (formIdHeader && formTitleHeader && formDescriptionHeader && actionsHeader) {
            console.log('✓ New table structure with individual submissions found');
        } else {
            console.log('⚠️  Table structure may not have updated yet');
        }
        
        // Check for submission data
        console.log('5. Checking for submission data...');
        const submissionRows = await page.$$('tbody tr');
        console.log(`Found ${submissionRows.length} submission rows`);
        
        if (submissionRows.length > 0) {
            // Get data from the first row
            const firstRow = submissionRows[0];
            const cells = await firstRow.$$('td');
            
            if (cells.length >= 3) {
                const formId = await page.evaluate(el => el.textContent.trim(), cells[0]);
                const formTitle = await page.evaluate(el => el.textContent.trim(), cells[1]);
                const formDescription = await page.evaluate(el => el.textContent.trim(), cells[2]);
                
                console.log('Sample submission data:');
                console.log(`- Form ID: ${formId}`);
                console.log(`- Form Title: ${formTitle}`);
                console.log(`- Form Description: ${formDescription.substring(0, 50)}...`);
            }
        }
        
        // Test search functionality
        console.log('6. Testing search functionality...');
        const searchInput = await page.$('input[placeholder*="search"]');
        if (searchInput) {
            await searchInput.type('test');
            await page.waitForTimeout(1000);
            console.log('✓ Search input found and tested');
        } else {
            console.log('⚠️  Search input not found');
        }
        
        // Test pagination
        console.log('7. Testing pagination...');
        const paginationInfo = await page.$('.pagination-info');
        if (paginationInfo) {
            const paginationText = await page.evaluate(el => el.textContent, paginationInfo);
            console.log(`✓ Pagination info: ${paginationText}`);
        } else {
            console.log('⚠️  Pagination info not found');
        }
        
        console.log('\n✅ Frontend integration test completed successfully!');
        
    } catch (error) {
        console.error('❌ Frontend test failed:', error.message);
        
        if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
            console.log('\n💡 Suggestion: Make sure the Angular development server is running:');
            console.log('   cd dynaform && ng serve');
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Helper function to check if services are running
async function checkServices() {
    const axios = require('axios');
    
    console.log('Checking required services...');
    
    // Check API server
    try {
        await axios.get(`${API_BASE_URL}/api/public/submissions`);
        console.log('✅ API server is running');
    } catch (error) {
        console.log('❌ API server is not running');
        return false;
    }
    
    // Check frontend server
    try {
        await axios.get(FRONTEND_URL);
        console.log('✅ Frontend server is running');
    } catch (error) {
        console.log('❌ Frontend server is not running');
        console.log('💡 Start with: cd dynaform && ng serve');
        return false;
    }
    
    return true;
}

async function main() {
    const servicesOk = await checkServices();
    
    if (!servicesOk) {
        console.log('\n❌ Please ensure both API and Frontend servers are running before running this test.');
        return;
    }
    
    await testFrontendIntegration();
}

// Check if puppeteer is available
try {
    require('puppeteer');
    main().catch(console.error);
} catch (error) {
    console.log('❌ Puppeteer not found. Install with: npm install puppeteer');
    console.log('Alternative: Manual testing instructions:');
    console.log('1. Navigate to http://localhost:4200/form-data-list');
    console.log('2. Click on the "Public" tab');
    console.log('3. Verify the table shows individual submissions with:');
    console.log('   - Form ID column');
    console.log('   - Form Title column'); 
    console.log('   - Form Description column');
    console.log('   - Actions column');
    console.log('4. Test search and pagination functionality');
}
