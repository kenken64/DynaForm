"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// POST /api/describe-image - Upload and describe an image
router.post('/describe-image', (0, upload_1.uploadSingle)('imageFile'), controllers_1.imageController.describeImage);
// POST /api/summarize-text - Summarize text
router.post('/summarize-text', controllers_1.imageController.summarizeText);
// GET /api/health - Health check endpoint
router.get('/health', controllers_1.imageController.healthCheck);
// GET /api/cache/stats - Get cache statistics
router.get('/cache/stats', controllers_1.imageController.getCacheStats);
// GET /api/cache/performance - Get detailed cache performance metrics
router.get('/cache/performance', controllers_1.imageController.getCachePerformance);
// DELETE /api/cache/clear - Clear all cache entries
router.delete('/cache/clear', controllers_1.imageController.clearCache);
exports.default = router;
//# sourceMappingURL=imageRoutes.js.map