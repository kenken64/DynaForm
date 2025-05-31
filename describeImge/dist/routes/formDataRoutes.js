"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// GET /api/form-data - Get all form data with optional formId filtering
router.get('/', controllers_1.formDataController.getAllFormData);
// GET /api/form-data/search - Search form data submissions
router.get('/search', controllers_1.formDataController.searchFormData);
// POST /api/forms-data - Save form submission data
router.post('/', controllers_1.formDataController.saveFormData);
// GET /api/forms-data/:formId - Get form data by form ID
router.get('/:formId', controllers_1.formDataController.getFormData);
// GET /api/forms-data/submissions/:formId - Get all submissions for a form
router.get('/submissions/:formId', controllers_1.formDataController.getFormSubmissions);
// DELETE /api/forms-data/:id - Delete form data by ID
router.delete('/:id', controllers_1.formDataController.deleteFormData);
exports.default = router;
//# sourceMappingURL=formDataRoutes.js.map