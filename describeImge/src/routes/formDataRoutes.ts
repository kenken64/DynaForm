import { Router } from 'express';
import { formDataController } from '../controllers';

const router = Router();

// GET /api/form-data - Get all form data with optional formId filtering
router.get('/', formDataController.getAllFormData);

// GET /api/form-data/search - Search form data submissions
router.get('/search', formDataController.searchFormData);

// POST /api/forms-data - Save form submission data
router.post('/', formDataController.saveFormData);

// GET /api/forms-data/:formId - Get form data by form ID
router.get('/:formId', formDataController.getFormData);

// GET /api/forms-data/submissions/:formId - Get all submissions for a form
router.get('/submissions/:formId', formDataController.getFormSubmissions);

// DELETE /api/forms-data/:id - Delete form data by ID
router.delete('/:id', formDataController.deleteFormData);

export default router;