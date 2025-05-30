import { Router } from 'express';
import { FormController } from '../controllers';

const router = Router();
const formController = new FormController();

/**
 * @route POST /api/forms
 * @description Save a new form
 * @access Public
 */
router.post('/', (req, res) => {
    formController.saveForm(req, res);
});

/**
 * @route GET /api/forms
 * @description Get all forms with pagination
 * @access Public
 */
router.get('/', (req, res) => {
    formController.getForms(req, res);
});

/**
 * @route GET /api/forms/search
 * @description Search forms by name or field names
 * @access Public
 */
router.get('/search', (req, res) => {
    formController.searchForms(req, res);
});

/**
 * @route GET /api/forms/:id
 * @description Get a specific form by ID
 * @access Public
 */
router.get('/:id', (req, res) => {
    formController.getFormById(req, res);
});

/**
 * @route PUT /api/forms/:id
 * @description Update a form by ID
 * @access Public
 */
router.put('/:id', (req, res) => {
    formController.updateForm(req, res);
});

/**
 * @route DELETE /api/forms/:id
 * @description Delete a form by ID
 * @access Public
 */
router.delete('/:id', (req, res) => {
    formController.deleteForm(req, res);
});

export default router;
