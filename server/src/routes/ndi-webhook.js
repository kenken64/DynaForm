const express = require('express');
const router = express.Router();

// In-memory store (resets on server restart)
let latestProof = null;

// POST endpoint for receiving webhook
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    console.log("📩 Webhook received:");
    console.log(JSON.stringify(body, null, 2));

    // Store only if it's a valid proof response
    if (body.type === "present-proof/presentation-result") {
      latestProof = body;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// GET endpoint for frontend polling to get the latest proof
router.get('/', (req, res) => {
  res.json({ proof: latestProof });
});

module.exports = router;
