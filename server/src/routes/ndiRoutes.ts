import { Router } from 'express';
import { ndiController } from '../controllers/ndiController';

const router = Router();

// POST /api/ndi/register - Register user with NDI verification
router.post('/register', ndiController.registerUser);

// POST /api/ndi/proof-request - Create a new proof request
router.post('/proof-request', ndiController.createProofRequest);

// GET /api/ndi/proof-status/:threadId - Get status of a proof request
router.get('/proof-status/:threadId', ndiController.getProofStatus);

export default router;
