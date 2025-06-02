import { Router } from 'express';
import { formDataController } from '../controllers';
import { verifyToken } from '../middleware/auth';

const router = Router();

// GET /api/form-data - Get all form data with optional formId filtering (temporarily without auth for debugging)
router.get('/', formDataController.getAllFormData);

// GET /api/form-data/search - Search form data submissions (temporarily without auth for debugging)
router.get('/search', formDataController.searchFormData);

// POST /api/forms-data - Save form submission data (requires authentication)
router.post('/', verifyToken, formDataController.saveFormData);

// GET /api/forms-data/:formId - Get form data by form ID (requires authentication)
router.get('/:formId', verifyToken, formDataController.getFormData);

// GET /api/forms-data/submissions/:formId - Get all submissions for a form (requires authentication)
router.get('/submissions/:formId', verifyToken, formDataController.getFormSubmissions);

// DELETE /api/forms-data/:id - Delete form data by ID (requires authentication)
router.delete('/:id', verifyToken, formDataController.deleteFormData);

export default router;