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
exports.default = router;
//# sourceMappingURL=publicRoutes.js.map