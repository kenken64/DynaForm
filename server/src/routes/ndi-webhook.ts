import express, { Request, Response } from 'express';
import { SSEService } from '../services/sseService';

const router = express.Router();

// In-memory store (resets on server restart)
let latestProof: any = null;

// POST endpoint for receiving webhook
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    console.log("📩 Webhook received:");
    console.log(JSON.stringify(body, null, 2));

    // For now, treat every webhook call as positive (as requested)
    // Store the webhook payload
    latestProof = body;

    // Send SSE event to notify frontend about the webhook
    // Since we don't have thread ID from webhook, broadcast to all connections
    SSEService.broadcast('ndi-verification', {
      success: true,
      message: 'NDI verification completed successfully',
      data: body,
      timestamp: new Date().toISOString()
    });

    console.log("✅ NDI verification event broadcasted via SSE");

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
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
