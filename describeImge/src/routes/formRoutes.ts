import { Router } from 'express';
import { formController } from '../controllers';

const router = Router();

// POST /api/forms - Save a new form
router.post('/', formController.saveForm);

// GET /api/forms - Get all forms with pagination
router.get('/', formController.getForms);

// GET /api/forms/search - Search forms
router.get('/search', formController.searchForms);

// GET /api/forms/:id - Get a specific form by ID
router.get('/:id', formController.getFormById);

// PUT /api/forms/:id - Update a form by ID
router.put('/:id', formController.updateForm);

// DELETE /api/forms/:id - Delete a form by ID
router.delete('/:id', formController.deleteForm);

export default router;