import { Router } from 'express';
import { recipientController } from '../controllers';
import { verifyToken } from '../middleware/auth';

const router = Router();

// POST /api/recipients - Create a new recipient (requires authentication)
router.post('/', verifyToken, recipientController.createRecipient);

// GET /api/recipients - Get user's recipients with pagination and search (requires authentication)
router.get('/', verifyToken, recipientController.getRecipients);

// GET /api/recipients/export - Export recipients as CSV (requires authentication)
router.get('/export', verifyToken, recipientController.exportRecipients);

// GET /api/recipients/:id - Get a specific recipient by ID (requires authentication)
router.get('/:id', verifyToken, recipientController.getRecipient);

// PUT /api/recipients/:id - Update a recipient by ID (requires authentication)
router.put('/:id', verifyToken, recipientController.updateRecipient);

// DELETE /api/recipients/:id - Delete a recipient by ID (requires authentication)
router.delete('/:id', verifyToken, recipientController.deleteRecipient);

export default router;
