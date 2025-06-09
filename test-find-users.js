const { MongoClient } = require('mongodb');

async function findUsers() {
  const client = new MongoClient('mongodb://doc2formapp:apppassword123@localhost:27017/doc2formjson?authSource=admin');
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('doc2formjson');
    
    // Check forms collection to find actual userIds
    console.log('\n📋 Finding forms and their user IDs...');
    const forms = await db.collection('generated_form').find({}).limit(5).toArray();
    
    if (forms.length === 0) {
      console.log('❌ No forms found in database');
    } else {
      console.log(`✅ Found ${forms.length} forms:`);
      forms.forEach((form, index) => {
        console.log(`   ${index + 1}. Form ID: ${form._id}`);
        console.log(`      User Info: ${JSON.stringify(form.userInfo)}`);
        console.log(`      Title: ${form.metadata?.formName || 'Untitled'}`);
        console.log(`      Status: ${form.status || 'unknown'}`);
        console.log('');
      });
    }
    
    // Check submissions collection
    console.log('\n📝 Finding submissions and their form IDs...');
    const submissions = await db.collection('public_form_submissions').find({}).limit(5).toArray();
    
    if (submissions.length === 0) {
      console.log('❌ No submissions found in database');
    } else {
      console.log(`✅ Found ${submissions.length} submissions:`);
      submissions.forEach((submission, index) => {
        console.log(`   ${index + 1}. Submission ID: ${submission._id}`);
        console.log(`      Form ID: ${submission.formId}`);
        console.log(`      Fingerprint: ${submission.jsonFingerprint}`);
        console.log(`      Submitted At: ${submission.submittedAt}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

findUsers();
