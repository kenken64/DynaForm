import { Router } from 'express';
import { FormDataController } from '../controllers';

const router = Router();
const formDataController = new FormDataController();

/**
 * @route POST /api/forms-data
 * @description Save form submission data
 * @access Public
 */
router.post('/', (req, res) => {
    formDataController.saveFormData(req, res);
});

/**
 * @route GET /api/forms-data/:formId
 * @description Get form data by form ID and optional user ID
 * @access Public
 */
router.get('/:formId', (req, res) => {
    formDataController.getFormData(req, res);
});

/**
 * @route GET /api/forms-data/submissions/:formId
 * @description Get all submissions for a specific form
 * @access Public
 */
router.get('/submissions/:formId', (req, res) => {
    formDataController.getFormSubmissions(req, res);
});

/**
 * @route DELETE /api/forms-data/:formId
 * @description Delete form data by form ID and optional user ID
 * @access Public
 */
router.delete('/:formId', (req, res) => {
    formDataController.deleteFormData(req, res);
});

/**
 * @route DELETE /api/forms-data/submissions/:formId
 * @description Delete all submissions for a specific form
 * @access Public
 */
router.delete('/submissions/:formId', (req, res) => {
    formDataController.deleteAllFormSubmissions(req, res);
});

export default router;
