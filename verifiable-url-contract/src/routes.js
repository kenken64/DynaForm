const express = require('express');
const router = express.Router();
const { addURL, verifyURL, getContractStatus } = require('./contract');

// Get contract configuration status
router.get('/status', async (req, res) => {
  try {
    const status = await getContractStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add URL to blockchain (Admin only)
router.post('/urls', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    const tx = await addURL(url);
    res.json({ 
      message: 'URL added to blockchain',
      transactionHash: tx.hash 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify URL
router.get('/verify', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    const isVerified = await verifyURL(url);
    res.json({ url, isVerified });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;