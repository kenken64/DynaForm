import express, { Request, Response } from 'express';
import { SSEService } from '../services/sseService';

const router = express.Router();

// In-memory store (resets on server restart)
let latestProof: any = null;

// Helper function to determine if webhook indicates successful verification
function determineVerificationSuccess(body: any): boolean {
  // Primary check: NDI's verification_result field - ONLY ProofValidated is considered success
  const ndiVerificationResult = body.verification_result;
  const isProofValidated = ndiVerificationResult === 'ProofValidated';
  
  console.log(`🔍 NDI verification_result: "${ndiVerificationResult}" - Valid: ${isProofValidated}`);
  
  // Return true ONLY if verification_result is exactly "ProofValidated"
  // All other values (ProofRejected, ProofInvalid, etc.) are treated as failure
  return isProofValidated;
}

// POST endpoint for receiving webhook
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    console.log("📩 ========== NDI WEBHOOK RECEIVED ==========");
    console.log("🕒 Timestamp:", new Date().toISOString());
    console.log("📋 Full Payload:");
    console.log(JSON.stringify(body, null, 2));
    
    // Detailed payload analysis
    console.log("\n🔍 ========== DETAILED PAYLOAD ANALYSIS ==========");
    
    // Check webhook structure
    if (body.data) {
      console.log("✅ Webhook has 'data' field");
      console.log("📊 Data type:", typeof body.data);
      console.log("📊 Data content:", JSON.stringify(body.data, null, 2));
    } else {
      console.log("❌ No 'data' field in webhook");
    }

    // Check for common NDI verification fields
    const checkField = (obj: any, path: string) => {
      const value = path.split('.').reduce((current, key) => current?.[key], obj);
      console.log(`📌 ${path}:`, value !== undefined ? value : "❌ NOT FOUND");
      return value;
    };

    console.log("\n🎯 ========== KEY VERIFICATION FIELDS ==========");
    checkField(body, 'type');
    checkField(body, 'verification_result'); // NDI primary success indicator
    checkField(body, 'status');
    checkField(body, 'state');
    checkField(body, 'thid'); // NDI thread ID
    checkField(body, 'relationship_did');
    checkField(body, 'holder_did');
    checkField(body, 'requested_presentation'); // NDI proof data
    checkField(body, 'requested_presentation.revealed_attrs'); // NDI user data
    checkField(body, 'data.threadId');
    checkField(body, 'data.proofRequestThreadId');
    checkField(body, 'data.proof');
    checkField(body, 'data.proofStatus');
    checkField(body, 'data.verified');
    checkField(body, 'data.isVerified');
    checkField(body, 'data.verification');
    checkField(body, 'data.proofData');
    checkField(body, 'data.attributes');
    checkField(body, 'data.credentials');

    // Check for proof data and attributes
    if (body.data?.proof) {
      console.log("\n🔐 ========== PROOF DATA ANALYSIS ==========");
      console.log("📋 Proof structure:", JSON.stringify(body.data.proof, null, 2));
      
      if (body.data.proof.requestedProof) {
        console.log("✅ Has requestedProof");
        console.log("📊 Requested proof:", JSON.stringify(body.data.proof.requestedProof, null, 2));
      }
      
      if (body.data.proof.identifiers) {
        console.log("✅ Has identifiers");
        console.log("📊 Identifiers:", JSON.stringify(body.data.proof.identifiers, null, 2));
      }
    }

    // Check for verification status indicators
    console.log("\n🚦 ========== VERIFICATION STATUS ANALYSIS ==========");
    const possibleSuccessFields = [
      'verification_result', // NDI primary indicator
      'type', // NDI event type
      'success', 'verified', 'isVerified', 'status', 'state',
      'data.success', 'data.verified', 'data.isVerified', 'data.status', 'data.state',
      'data.proof.verified', 'data.proofStatus', 'data.verification.success',
      'data.verification_result' // In case it's nested
    ];
    
    possibleSuccessFields.forEach(field => {
      const value = checkField(body, field);
      if (value !== undefined) {
        console.log(`🎯 POTENTIAL SUCCESS INDICATOR - ${field}:`, value);
        if (field === 'verification_result') {
          console.log(`   ✅ PRIMARY NDI INDICATOR: ${value === 'ProofValidated' ? 'VALID' : 'INVALID'}`);
        }
      }
    });

    // Check for user data (ID Number, Full Name, etc.)
    console.log("\n👤 ========== USER DATA ANALYSIS ==========");
    const userDataPaths = [
      'requested_presentation.revealed_attrs', // NDI primary user data location
      'requested_presentation.revealed_attr_groups',
      'requested_presentation.identifiers',
      'data.proof.requestedProof.revealedAttrs',
      'data.proof.requestedProof.revealedAttrGroups',
      'data.attributes',
      'data.userData',
      'data.credentials',
      'data.proof.revealedAttrs',
      'data.requested_presentation.revealed_attrs' // NDI nested path
    ];
    
    userDataPaths.forEach(path => {
      const value = checkField(body, path);
      if (value) {
        console.log(`👤 USER DATA FOUND at ${path}:`, JSON.stringify(value, null, 2));
        
        // Special handling for NDI revealed_attrs
        if (path.includes('revealed_attrs') && typeof value === 'object') {
          Object.keys(value).forEach(attrKey => {
            console.log(`   📋 Attribute "${attrKey}":`, value[attrKey]);
          });
        }
      }
    });

    // Log headers for debugging
    console.log("\n📧 ========== REQUEST HEADERS ==========");
    console.log("Authorization:", req.headers.authorization ? "Present" : "❌ Missing");
    console.log("Content-Type:", req.headers['content-type']);
    console.log("User-Agent:", req.headers['user-agent']);
    console.log("X-Forwarded-For:", req.headers['x-forwarded-for']);

    // Determine if this looks like a successful verification
    const isLikelySuccess = determineVerificationSuccess(body);
    console.log("\n🎯 ========== VERIFICATION ASSESSMENT ==========");
    console.log(`🔍 Likely successful verification: ${isLikelySuccess ? '✅ YES' : '❌ NO'}`);
    
    if (!isLikelySuccess) {
      console.log("⚠️  WARNING: This webhook may be a false positive or incomplete verification");
      console.log("📋 Reasons for concern:");
      
      // List specific concerns
      if (!body.data) console.log("   - No 'data' field");
      if (!body.data?.proof) console.log("   - No proof data");
      if (!body.status && !body.data?.status) console.log("   - No status field");
      if (!body.data?.verified && !body.verified && !body.success) console.log("   - No success indicators");
    }

    console.log("\n================================================\n");

    // Store the webhook payload
    latestProof = body;

    // Determine if verification was successful based on verification_result
    const isSuccessful = determineVerificationSuccess(body);
    
    console.log(`🎯 FINAL VERIFICATION DECISION: ${isSuccessful ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`📋 Based on verification_result: "${body.verification_result}"`);

    // Only send positive SSE event if verification_result is ProofValidated
    if (isSuccessful) {
      // Send SSE event to notify frontend about successful verification
      SSEService.broadcast('ndi-verification', {
        success: true,
        message: 'NDI verification completed successfully',
        data: body,
        timestamp: new Date().toISOString(),
        verification_result: body.verification_result,
        analysis: {
          likelySuccess: isSuccessful,
          hasProofData: !!(
            body.requested_presentation || 
            body.data?.proof || 
            body.data?.requested_presentation || 
            body.data?.attributes ||
            body.data?.credentials ||
            body.data?.userData
          ),
          hasUserData: !!(
            body.requested_presentation?.revealed_attrs ||
            body.requested_presentation?.revealed_attr_groups ||
            body.data?.proof?.requestedProof ||
            body.data?.requested_presentation?.revealed_attrs ||
            body.data?.requested_presentation?.revealed_attr_groups ||
            body.data?.attributes ||
            body.data?.userData ||
            (body.requested_presentation?.revealed_attrs && Object.keys(body.requested_presentation.revealed_attrs).length > 0)
          )
        }
      });

      console.log("✅ NDI verification SUCCESS event broadcasted via SSE");
    } else {
      console.log("❌ NDI verification FAILED - No SSE event sent");
      console.log(`📋 Reason: verification_result is "${body.verification_result}" (expected "ProofValidated")`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// GET endpoint for frontend polling to get the latest proof (legacy support)
router.get('/', (req: Request, res: Response) => {
  res.json({ proof: latestProof });
});

// SSE endpoint for real-time notifications
router.get('/events', (req: Request, res: Response) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Send initial connection confirmation
  res.write(`event: connected\ndata: ${JSON.stringify({ 
    message: 'SSE connection established',
    timestamp: new Date().toISOString() 
  })}\n\n`);

  const threadId = req.query.threadId as string || 'default';
  
  // Add this connection to SSE service
  SSEService.addConnection(threadId, res);

  console.log(`SSE: New connection established for thread ${threadId}`);

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ 
        timestamp: new Date().toISOString() 
      })}\n\n`);
    } catch (error) {
      clearInterval(heartbeat);
    }
  }, 30000); // Send heartbeat every 30 seconds

  // Clean up on connection close
  res.on('close', () => {
    clearInterval(heartbeat);
    SSEService.removeConnection(threadId, res);
    console.log(`SSE: Connection closed for thread ${threadId}`);
  });
});

export default router;
