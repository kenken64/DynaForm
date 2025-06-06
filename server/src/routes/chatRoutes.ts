import express from 'express';
import { chatController } from '../controllers/chatController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all chat routes
router.use(verifyToken);

// POST /api/chat/ask-dynaform - Send a message to the chat service
router.post('/ask-dynaform', chatController.sendMessage);

// GET /api/chat/health - Check chat service health
router.get('/health', chatController.healthCheck);

export default router;
