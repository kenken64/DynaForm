"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const router = (0, express_1.Router)();
// GET /api/public/forms - Get public form by formId and jsonFingerprint (no authentication required)
router.get('/forms', controllers_1.publicFormController.getPublicForm);
// GET /api/public/forms/fingerprint/:fingerprint - Get public form by PDF fingerprint (no authentication required)
router.get('/forms/fingerprint/:fingerprint', controllers_1.publicFormController.getFormByPdfFingerprint);
// POST /api/public/forms/submit - Submit public form data (no authentication required)
router.post('/forms/submit', controllers_1.publicFormController.submitPublicForm);
// GET /api/public/submissions - Get all public form submissions with pagination and search (no authentication required)
router.get('/submissions', controllers_1.publicFormController.getPublicSubmissions);
// GET /api/public/export-submissions - Export public submissions to Excel (optional formId query param)
router.get('/export-submissions', controllers_1.publicFormController.exportPublicSubmissions);
// GET /api/public/submissions/aggregated - Get aggregated public submissions data by form (no authentication required)
router.get('/submissions/aggregated', controllers_1.publicFormController.getAggregatedPublicSubmissions);
// GET /api/public/submissions/user/:userId - Get public submissions for a specific user (no authentication required)
router.get('/submissions/user/:userId', controllers_1.publicFormController.getUserPublicSubmissions);
// GET /api/public/submissions/user/:userId/forms - Get aggregated public forms for a specific user (no authentication required)
router.get('/submissions/user/:userId/forms', controllers_1.publicFormController.getUserPublicFormsAggregated);
// GET /api/public/submissions/:formId - Get public submissions for a specific form (no authentication required)
router.get('/submissions/:formId', controllers_1.publicFormController.getPublicSubmissionsByForm);
exports.default = router;
//# sourceMappingURL=publicRoutes.js.map