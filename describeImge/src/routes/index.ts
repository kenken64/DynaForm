import { Router } from 'express';
import imageRoutes from './imageRoutes';
import formRoutes from './formRoutes';
import formDataRoutes from './formDataRoutes';

const router = Router();

// Mount all routes under /api prefix for consistency
router.use('/api', imageRoutes);
router.use('/api/forms', formRoutes);
router.use('/api/forms-data', formDataRoutes);

// Keep health check at root level for monitoring tools
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;