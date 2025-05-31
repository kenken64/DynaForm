import { Router } from 'express';
import { formDataController } from '../controllers';

const router = Router();

// GET /api/form-data - Get all form data with optional formId filtering
router.get('/', formDataController.getAllFormData);

// POST /api/forms-data - Save form submission data
router.post('/', formDataController.saveFormData);

// GET /api/forms-data/:formId - Get form data by form ID
router.get('/:formId', formDataController.getFormData);

// GET /api/forms-data/submissions/:formId - Get all submissions for a form
router.get('/submissions/:formId', formDataController.getFormSubmissions);

export default router;