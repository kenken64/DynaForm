const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://doc2formapp:apppassword123@localhost:27017/doc2formjson';

console.log('Testing MongoDB Data Structure for User Public Submissions');
console.log('========================================================');

async function testDataStructure() {
    let client;
    
    try {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db();
        
        // Test 1: Check public_form_submissions collection structure
        console.log('\n1. Analyzing public_form_submissions collection...');
        const publicSubmissions = await db.collection('public_form_submissions').findOne({});
        if (publicSubmissions) {
            console.log('✓ Found public submissions');
            console.log('Sample document structure:', Object.keys(publicSubmissions));
            console.log('Sample data:');
            console.log(`- _id: ${publicSubmissions._id}`);
            console.log(`- userId: ${publicSubmissions.userId}`);
            console.log(`- formId: ${publicSubmissions.formId}`);
            console.log(`- submissionData: ${typeof publicSubmissions.submissionData}`);
            console.log(`- submittedAt: ${publicSubmissions.submittedAt}`);
        } else {
            console.log('⚠️  No public submissions found - collection may be empty');
        }
        
        // Test 2: Check generated_form collection structure
        console.log('\n2. Analyzing generated_form collection...');
        const generatedForm = await db.collection('generated_form').findOne({});
        if (generatedForm) {
            console.log('✓ Found generated forms');
            console.log('Sample document structure:', Object.keys(generatedForm));
            console.log('Sample data:');
            console.log(`- _id: ${generatedForm._id}`);
            console.log(`- title: ${generatedForm.title}`);
            console.log(`- description: ${generatedForm.description}`);
            console.log(`- formSchema: ${typeof generatedForm.formSchema}`);
            console.log(`- userId: ${generatedForm.userId}`);
            console.log(`- createdAt: ${generatedForm.createdAt}`);
        } else {
            console.log('⚠️  No generated forms found - collection may be empty');
        }
        
        // Test 3: Test the aggregation pipeline we implemented
        console.log('\n3. Testing aggregation pipeline...');
        const testUserId = 'test-user-123';
        const pipeline = [
            {
                $match: {
                    userId: testUserId
                }
            },
            {
                $lookup: {
                    from: 'generated_form',
                    let: { formId: { $toObjectId: '$formId' } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$formId'] }
                            }
                        }
                    ],
                    as: 'formData'
                }
            },
            {
                $unwind: {
                    path: '$formData',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    formId: 1,
                    submissionData: 1,
                    submittedAt: 1,
                    formTitle: '$formData.title',
                    formDescription: '$formData.description'
                }
            },
            {
                $sort: { submittedAt: -1 }
            },
            {
                $limit: 10
            }
        ];
        
        const aggregationResults = await db.collection('public_form_submissions').aggregate(pipeline).toArray();
        console.log(`✓ Aggregation pipeline executed successfully`);
        console.log(`Results count: ${aggregationResults.length}`);
        
        if (aggregationResults.length > 0) {
            console.log('Sample aggregated result:');
            const sample = aggregationResults[0];
            console.log(`- Form ID: ${sample.formId}`);
            console.log(`- Form Title: ${sample.formTitle || 'N/A'}`);
            console.log(`- Form Description: ${sample.formDescription || 'N/A'}`);
            console.log(`- User ID: ${sample.userId}`);
            console.log(`- Submitted At: ${sample.submittedAt}`);
        } else {
            console.log(`⚠️  No results for user ${testUserId} - try with a real user ID`);
        }
        
        // Test 4: Get actual user IDs from the data
        console.log('\n4. Finding actual user IDs in the data...');
        const userIds = await db.collection('public_form_submissions').distinct('userId');
        console.log('Available user IDs:', userIds.slice(0, 5)); // Show first 5
        
        if (userIds.length > 0) {
            console.log(`\n5. Testing with real user ID: ${userIds[0]}`);
            const realUserPipeline = [...pipeline];
            realUserPipeline[0].$match.userId = userIds[0];
            
            const realResults = await db.collection('public_form_submissions').aggregate(realUserPipeline).toArray();
            console.log(`Results for real user: ${realResults.length}`);
            
            if (realResults.length > 0) {
                console.log('Real user sample result:');
                const sample = realResults[0];
                console.log(`- Form ID: ${sample.formId}`);
                console.log(`- Form Title: ${sample.formTitle || 'N/A'}`);
                console.log(`- Form Description: ${sample.formDescription ? sample.formDescription.substring(0, 50) + '...' : 'N/A'}`);
                console.log(`- User ID: ${sample.userId}`);
            }
        }
        
        // Test 5: Check if formId format is compatible
        console.log('\n6. Checking formId format compatibility...');
        const formIds = await db.collection('public_form_submissions').distinct('formId');
        const generatedFormIds = await db.collection('generated_form').distinct('_id');
        
        console.log('Sample formId from submissions:', formIds[0]);
        console.log('Sample _id from generated_form:', generatedFormIds[0]);
        console.log('formId type:', typeof formIds[0]);
        console.log('generated_form _id type:', typeof generatedFormIds[0]);
        
        // Check if we can convert formId to ObjectId
        const { ObjectId } = require('mongodb');
        try {
            if (formIds[0]) {
                const convertedId = new ObjectId(formIds[0]);
                console.log('✓ formId can be converted to ObjectId');
            }
        } catch (error) {
            console.log('⚠️  formId cannot be converted to ObjectId:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('\n✅ Database connection closed');
        }
    }
}

testDataStructure().catch(console.error);
