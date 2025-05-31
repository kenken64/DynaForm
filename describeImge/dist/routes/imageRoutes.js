"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// POST /api/describe-image - Upload and describe an image
router.post('/describe-image', (0, upload_1.uploadSingle)('imageFile'), controllers_1.imageController.describeImage);
// GET /api/healthcheck - Health check endpoint
router.get('/healthcheck', controllers_1.imageController.healthCheck);
exports.default = router;
//# sourceMappingURL=imageRoutes.js.map