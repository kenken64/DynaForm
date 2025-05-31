"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// POST /api/forms - Save a new form
router.post('/', controllers_1.formController.saveForm);
// GET /api/forms - Get all forms with pagination
router.get('/', controllers_1.formController.getForms);
// GET /api/forms/search - Search forms
router.get('/search', controllers_1.formController.searchForms);
// GET /api/forms/:id - Get a specific form by ID
router.get('/:id', controllers_1.formController.getFormById);
// DELETE /api/forms/:id - Delete a form by ID
router.delete('/:id', controllers_1.formController.deleteForm);
exports.default = router;
//# sourceMappingURL=formRoutes.js.map