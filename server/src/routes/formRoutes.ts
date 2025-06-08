import { Router } from 'express';
import { formController } from '../controllers';
import { verifyToken } from '../middleware/auth';

const router = Router();

// POST /api/forms - Save a new form (requires authentication)
router.post('/', verifyToken, formController.saveForm);

// GET /api/forms - Get user's forms with pagination (requires authentication)
router.get('/', verifyToken, formController.getForms);

// GET /api/forms/search - Search user's forms (requires authentication)
router.get('/search', verifyToken, formController.searchForms);

// GET /api/forms/fingerprint/:fingerprint - Get forms by PDF fingerprint (requires authentication)
router.get('/fingerprint/:fingerprint', verifyToken, formController.getFormsByPdfFingerprint);

// GET /api/forms/:id - Get a specific form by ID (requires authentication)
router.get('/:id', verifyToken, formController.getFormById);

// PUT /api/forms/:id - Update a form by ID (requires authentication)
router.put('/:id', verifyToken, formController.updateForm);

// DELETE /api/forms/:id - Delete a form by ID (requires authentication)
router.delete('/:id', verifyToken, formController.deleteForm);

// GET /api/forms/verify/:formId - Verify form on blockchain (public endpoint, no auth required)
router.get('/verify/:formId', formController.verifyForm);

export default router;