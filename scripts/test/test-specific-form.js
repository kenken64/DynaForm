const { MongoClient, ObjectId } = require('mongodb');

async function checkSpecificForm() {
  const client = new MongoClient('mongodb://doc2formapp:apppassword123@localhost:27017/doc2formjson?authSource=admin');
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('doc2formjson');
    
    // Check the specific form that has submissions
    const formId = '68424bb77c8887c5c5eb4aed';
    console.log(`\n📋 Looking for form: ${formId}`);
    
    const form = await db.collection('generated_form').findOne({ 
      $or: [
        { _id: formId },
        { _id: new ObjectId(formId) }
      ]
    });
    
    if (!form) {
      console.log('❌ Form not found with that ID');
      
      // Let's try to find it by string match
      const formByString = await db.collection('generated_form').findOne({ _id: formId });
      if (formByString) {
        console.log('✅ Found form by string ID:');
        console.log(JSON.stringify(formByString, null, 2));
      } else {
        console.log('❌ Form not found by string ID either');
        
        // List all form IDs to see what we have
        const allForms = await db.collection('generated_form').find({}, { projection: { _id: 1, 'metadata.formName': 1, userInfo: 1 } }).toArray();
        console.log('\n📋 All available forms:');
        allForms.forEach((f, i) => {
          console.log(`   ${i + 1}. ID: ${f._id} | Title: ${f.metadata?.formName || 'Untitled'} | UserInfo: ${JSON.stringify(f.userInfo)}`);
        });
      }
    } else {
      console.log('✅ Found form:');
      console.log(JSON.stringify(form, null, 2));
    }
    
    // Count submissions for this form
    const submissionCount = await db.collection('public_form_submissions').countDocuments({ formId: formId });
    console.log(`\n📊 Submissions for form ${formId}: ${submissionCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkSpecificForm();
