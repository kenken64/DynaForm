"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/form-data - Get all form data with optional formId filtering (temporarily without auth for debugging)
router.get('/', controllers_1.formDataController.getAllFormData);
// GET /api/form-data/search - Search form data submissions (temporarily without auth for debugging)
router.get('/search', controllers_1.formDataController.searchFormData);
// POST /api/forms-data - Save form submission data (requires authentication)
router.post('/', auth_1.verifyToken, controllers_1.formDataController.saveFormData);
// GET /api/forms-data/:formId - Get form data by form ID (requires authentication)
router.get('/:formId', auth_1.verifyToken, controllers_1.formDataController.getFormData);
// GET /api/forms-data/submissions/:formId - Get all submissions for a form (requires authentication)
router.get('/submissions/:formId', auth_1.verifyToken, controllers_1.formDataController.getFormSubmissions);
// DELETE /api/forms-data/:id - Delete form data by ID (requires authentication)
router.delete('/:id', auth_1.verifyToken, controllers_1.formDataController.deleteFormData);
exports.default = router;
//# sourceMappingURL=formDataRoutes.js.map