"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// POST /api/forms-data - Save form submission data
router.post('/', controllers_1.formDataController.saveFormData);
// GET /api/forms-data/:formId - Get form data by form ID
router.get('/:formId', controllers_1.formDataController.getFormData);
// GET /api/forms-data/submissions/:formId - Get all submissions for a form
router.get('/submissions/:formId', controllers_1.formDataController.getFormSubmissions);
exports.default = router;
//# sourceMappingURL=formDataRoutes.js.map