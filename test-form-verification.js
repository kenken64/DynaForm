const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection (adjust as needed)
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'myapp';

async function createTestForm() {
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('generated_form');
    
    // Create a test form with verification data
    const testFormId = new ObjectId('675b18ab44242b5eeba4e410');
    const testForm = {
      _id: testFormId,
      formName: 'Test Verification Form',
      userId: new ObjectId(),
      createdAt: new Date(),
      status: 'verified',
      blockchainInfo: {
        transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
        blockNumber: 12345678,
        verifiedAt: new Date(),
        publicUrl: `http://localhost:4200/public/form/${testFormId}/test123`
      },
      formData: {
        title: 'Test Form',
        fields: [
          { name: 'name', type: 'text', label: 'Name' },
          { name: 'email', type: 'email', label: 'Email' }
        ]
      }
    };
    
    // Insert or update the test form
    const result = await collection.replaceOne(
      { _id: testFormId },
      testForm,
      { upsert: true }
    );
    
    console.log('Test form created/updated:', result);
    console.log('Test form ID:', testFormId.toString());
    
  } catch (error) {
    console.error('Error creating test form:', error);
  } finally {
    await client.close();
  }
}

createTestForm();
