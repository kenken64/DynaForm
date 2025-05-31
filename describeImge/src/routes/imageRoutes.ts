import { Router } from 'express';
import { imageController } from '../controllers';
import { uploadSingle } from '../middleware/upload';

const router = Router();

// GET /health - Health check endpoint
router.get('/health', imageController.healthCheck);

// POST /describe-image - Upload and describe an image
router.post('/describe-image', uploadSingle('imageFile'), imageController.describeImage);

// POST /summarize-text - Summarize text
router.post('/summarize-text', imageController.summarizeText);

export default router;