import express, { Request, Response } from 'express';
import { SSEService } from '../services/sseService';

const router = express.Router();

// In-memory store (resets on server restart)
let latestProof: any = null;

// Helper function to determine if webhook indicates successful verification
function determineVerificationSuccess(body: any): boolean {
  // Check multiple possible success indicators
  const successIndicators = [
    body.success,
    body.verified,
    body.isVerified,
    body.status === 'verified' || body.status === 'success' || body.status === 'completed',
    body.state === 'verified' || body.state === 'success' || body.state === 'completed',
    body.data?.success,
    body.data?.verified,
    body.data?.isVerified,
    body.data?.status === 'verified' || body.data?.status === 'success' || body.data?.status === 'completed',
    body.data?.state === 'verified' || body.data?.state === 'success' || body.data?.state === 'completed',
    body.data?.proof?.verified,
    body.data?.proofStatus === 'verified' || body.data?.proofStatus === 'success',
    body.data?.verification?.success,
    // NDI specific verification indicators
    body.data?.verification_result === 'ProofValidated',
    body.data?.type === 'present-proof/presentation-result' && body.data?.verification_result === 'ProofValidated'
  ];

  // Check if any success indicator is true
  const hasSuccessIndicator = successIndicators.some(indicator => indicator === true);

  // Check if we have proof data (another indicator of successful verification)
  const hasProofData = !!(
    body.data?.proof ||
    body.data?.attributes ||
    body.data?.credentials ||
    body.data?.userData ||
    body.data?.requested_presentation // NDI specific
  );

  // Check for revealed attributes (strong indicator of successful verification)
  const hasRevealedAttrs = !!(
    body.data?.proof?.requestedProof?.revealedAttrs ||
    body.data?.proof?.requestedProof?.revealedAttrGroups ||
    body.data?.proof?.revealedAttrs ||
    body.data?.requested_presentation?.revealed_attrs || // NDI specific
    body.data?.requested_presentation?.revealed_attr_groups // NDI specific
  );

  return hasSuccessIndicator || hasProofData || hasRevealedAttrs;
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
    checkField(body, 'status');
    checkField(body, 'state');
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
      'success', 'verified', 'isVerified', 'status', 'state',
      'data.success', 'data.verified', 'data.isVerified', 'data.status', 'data.state',
      'data.proof.verified', 'data.proofStatus', 'data.verification.success'
    ];
    
    possibleSuccessFields.forEach(field => {
      const value = checkField(body, field);
      if (value !== undefined) {
        console.log(`🎯 POTENTIAL SUCCESS INDICATOR - ${field}:`, value);
      }
    });

    // Check for user data (ID Number, Full Name, etc.)
    console.log("\n👤 ========== USER DATA ANALYSIS ==========");
    const userDataPaths = [
      'data.proof.requestedProof.revealedAttrs',
      'data.proof.requestedProof.revealedAttrGroups',
      'data.attributes',
      'data.userData',
      'data.credentials',
      'data.proof.revealedAttrs'
    ];
    
    userDataPaths.forEach(path => {
      const value = checkField(body, path);
      if (value) {
        console.log(`👤 USER DATA FOUND at ${path}:`, JSON.stringify(value, null, 2));
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

    // For now, treat every webhook call as positive (as requested)
    // Store the webhook payload
    latestProof = body;

    // Send SSE event to notify frontend about the webhook
    // Since we don't have thread ID from webhook, broadcast to all connections
    SSEService.broadcast('ndi-verification', {
      success: true,
      message: 'NDI verification completed successfully',
      data: body,
      timestamp: new Date().toISOString(),
      analysis: {
        likelySuccess: isLikelySuccess,
        hasProofData: !!body.data?.proof,
        hasUserData: !!(body.data?.proof?.requestedProof || body.data?.attributes)
      }
    });

    console.log("✅ NDI verification event broadcasted via SSE");

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
