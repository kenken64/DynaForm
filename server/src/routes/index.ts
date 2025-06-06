import { Router } from 'express';
import imageRoutes from './imageRoutes';
import formRoutes from './formRoutes';
import formDataRoutes from './formDataRoutes';
import recipientRoutes from './recipientRoutes';
import recipientGroupRoutes from './recipientGroupRoutes';
import publicRoutes from './publicRoutes';
import authRoutes from './authRoutes';
import chatRoutes from './chatRoutes';

const router = Router();

// Mount all routes under /api prefix for consistency
router.use('/api', imageRoutes);
router.use('/api/forms', formRoutes);
router.use('/api/forms-data', formDataRoutes);
router.use('/api/recipients', recipientRoutes);
router.use('/api/recipient-groups', recipientGroupRoutes);
router.use('/api/public', publicRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/chat', chatRoutes);

// Keep health check at root level for monitoring tools
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;