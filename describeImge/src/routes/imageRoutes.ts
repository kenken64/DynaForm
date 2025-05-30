import { Router } from 'express';
import { ImageController } from '../controllers';
import { uploadSingle } from '../middleware/upload';

const router = Router();
const imageController = new ImageController();

/**
 * @route POST /api/describe-image
 * @description Analyze an image using Ollama AI and return description
 * @access Public
 */
router.post('/describe-image', uploadSingle, (req, res) => {
    imageController.describeImage(req, res);
});

/**
 * @route GET /api/healthcheck
 * @description Check API and Ollama service health
 * @access Public
 */
router.get('/healthcheck', (req, res) => {
    imageController.healthCheck(req, res);
});

export default router;
