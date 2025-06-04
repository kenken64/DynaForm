import { Router } from 'express';
import { recipientGroupController } from '../controllers/recipientGroupController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// POST /api/recipient-groups - Create a new recipient group (requires authentication)
router.post('/', verifyToken, recipientGroupController.createRecipientGroup);

// GET /api/recipient-groups - Get user's recipient groups with pagination and search (requires authentication)
router.get('/', verifyToken, recipientGroupController.getRecipientGroups);

// GET /api/recipient-groups/export - Export recipient groups as CSV (requires authentication)
router.get('/export', verifyToken, recipientGroupController.exportRecipientGroups);

// GET /api/recipient-groups/search - Search groups by alias (requires authentication)
router.get('/search', verifyToken, recipientGroupController.searchByAlias);

// GET /api/recipient-groups/with-recipients - Get all groups with populated recipient details (requires authentication)
router.get('/with-recipients', verifyToken, recipientGroupController.getGroupsWithRecipients);

// GET /api/recipient-groups/:id - Get a specific recipient group by ID (requires authentication)
router.get('/:id', verifyToken, recipientGroupController.getRecipientGroup);

// PUT /api/recipient-groups/:id - Update a recipient group by ID (requires authentication)
router.put('/:id', verifyToken, recipientGroupController.updateRecipientGroup);

// DELETE /api/recipient-groups/:id - Delete a recipient group by ID (requires authentication)
router.delete('/:id', verifyToken, recipientGroupController.deleteRecipientGroup);

export default router;
