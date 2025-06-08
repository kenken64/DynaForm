"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/forms - Save a new form (requires authentication)
router.post('/', auth_1.verifyToken, controllers_1.formController.saveForm);
// GET /api/forms - Get user's forms with pagination (requires authentication)
router.get('/', auth_1.verifyToken, controllers_1.formController.getForms);
// GET /api/forms/search - Search user's forms (requires authentication)
router.get('/search', auth_1.verifyToken, controllers_1.formController.searchForms);
// GET /api/forms/fingerprint/:fingerprint - Get forms by PDF fingerprint (requires authentication)
router.get('/fingerprint/:fingerprint', auth_1.verifyToken, controllers_1.formController.getFormsByPdfFingerprint);
// GET /api/forms/:id - Get a specific form by ID (requires authentication)
router.get('/:id', auth_1.verifyToken, controllers_1.formController.getFormById);
// PUT /api/forms/:id - Update a form by ID (requires authentication)
router.put('/:id', auth_1.verifyToken, controllers_1.formController.updateForm);
// DELETE /api/forms/:id - Delete a form by ID (requires authentication)
router.delete('/:id', auth_1.verifyToken, controllers_1.formController.deleteForm);
// GET /api/forms/verify/:formId - Verify form on blockchain (public endpoint, no auth required)
router.get('/verify/:formId', controllers_1.formController.verifyForm);
exports.default = router;
//# sourceMappingURL=formRoutes.js.map