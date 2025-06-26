"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ndiController_1 = require("../controllers/ndiController");
const router = (0, express_1.Router)();
// POST /api/ndi/register - Register user with NDI verification
router.post('/register', ndiController_1.ndiController.registerUser);
// POST /api/ndi/proof-request - Create a new proof request
router.post('/proof-request', ndiController_1.ndiController.createProofRequest);
// GET /api/ndi/proof-status/:threadId - Get status of a proof request
router.get('/proof-status/:threadId', ndiController_1.ndiController.getProofStatus);
exports.default = router;
//# sourceMappingURL=ndiRoutes.js.map