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

    // Determine if this looks like a successful verification
    const isLikelySuccess = determineVerificationSuccess(body);
    console.log("\n🎯 ========== VERIFICATION ASSESSMENT ==========");
    console.log(`🔍 Likely successful verification: ${isLikelySuccess ? '✅ YES' : '❌ NO'}`);
    
    // Store the webhook payload
    latestProof = body;

    
    console.log(`📋 Based on verification_result: "${body.verification_result}"`);

    // Only send positive SSE event if verification_result is ProofValidated
    if (isLikelySuccess) {
      // Send SSE event to notify frontend about successful verification
      SSEService.broadcast('ndi-verification', {
        success: true,
        message: 'NDI verification completed successfully',
        data: body,
        timestamp: new Date().toISOString(),
        verification_result: body.verification_result,
        analysis: {
          likelySuccess: isLikelySuccess,
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
