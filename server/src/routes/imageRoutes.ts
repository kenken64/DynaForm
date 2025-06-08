import { Router } from 'express';
import { imageController } from '../controllers';
import { uploadSingle } from '../middleware/upload';

const router = Router();

// POST /api/describe-image - Upload and describe an image
router.post('/describe-image', uploadSingle('imageFile'), imageController.describeImage);

// POST /api/summarize-text - Summarize text
router.post('/summarize-text', imageController.summarizeText);

// GET /api/health - Health check endpoint
router.get('/health', imageController.healthCheck);

// GET /api/cache/stats - Get cache statistics
router.get('/cache/stats', imageController.getCacheStats);

// GET /api/cache/performance - Get detailed cache performance metrics
router.get('/cache/performance', imageController.getCachePerformance);

// DELETE /api/cache/clear - Clear all cache entries
router.delete('/cache/clear', imageController.clearCache);

export default router;