#!/usr/bin/env node

/**
 * Test script to send various webhook payloads to the NDI webhook endpoint
 * Run with: node test-ndi-webhook.js
 */

const https = require('https');

const WEBHOOK_URL = 'https://formbt.com/api/ndi-webhook';
// For local testing, use: 'http://localhost:3000/api/ndi-webhook'

// Test payloads - various scenarios
const testPayloads = [
  {
    name: "Empty webhook (false positive test)",
    payload: {}
  },
  {
    name: "Basic webhook with minimal data",
    payload: {
      type: "webhook",
      data: {
        threadId: "test-thread-123"
      }
    }
  },
  {
    name: "Successful verification simulation",
    payload: {
      type: "verification_complete",
      status: "verified",
      data: {
        threadId: "test-thread-456",
        verified: true,
        proof: {
          requestedProof: {
            revealedAttrs: {
              "ID Number": {
                raw: "12345678901234567890",
                encoded: "12345678901234567890"
              },
              "Full Name": {
                raw: "Test User",
                encoded: "Test User"
              }
            }
          },
          identifiers: [{
            schemaId: "https://dev-schema.ngotag.com/schemas/c7952a0a-e9b5-4a4b-a714-1e5d0a1ae076"
          }]
        }
      }
    }
  },
  {
    name: "Failed verification simulation",
    payload: {
      type: "verification_failed",
      status: "failed",
      data: {
        threadId: "test-thread-789",
        verified: false,
        error: "User declined verification"
      }
    }
  },
  {
    name: "Real-world structure simulation",
    payload: {
      type: "proof-request",
      data: {
        proofRequestThreadId: "real-thread-abc123",
        state: "verified",
        proofStatus: "verified",
        proof: {
          verified: true,
          requestedProof: {
            revealedAttrs: {
              "attr1_referent": {
                raw: "11234567890123456789",
                encoded: "11234567890123456789"
              },
              "attr2_referent": {
                raw: "John Doe Tester",
                encoded: "John Doe Tester"
              }
            }
          }
        }
      }
    }
  }
];

function sendWebhook(payload, name) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: 'formbt.com',
      port: 443,
      path: '/api/ndi-webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Bearer 32746327bnmbesfnbsdnfbdsf34', // Using webhook token
        'User-Agent': 'NDI-Webhook-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ ${name}: ${res.statusCode} - ${responseData}`);
        resolve({ status: res.statusCode, body: responseData });
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${name}: Error -`, error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log("🧪 Starting NDI Webhook Tests...");
  console.log("📡 Target URL:", WEBHOOK_URL);
  console.log("=" * 60);

  for (let i = 0; i < testPayloads.length; i++) {
    const test = testPayloads[i];
    console.log(`\n🔬 Test ${i + 1}/${testPayloads.length}: ${test.name}`);
    console.log("📋 Payload:", JSON.stringify(test.payload, null, 2));
    
    try {
      await sendWebhook(test.payload, test.name);
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Test failed:`, error.message);
    }
  }

  console.log("\n🏁 All tests completed!");
  console.log("📊 Check your server logs for detailed payload analysis");
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { sendWebhook, testPayloads };
