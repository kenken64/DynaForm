import { Router } from 'express';
import imageRoutes from './imageRoutes';
import formRoutes from './formRoutes';
import formDataRoutes from './formDataRoutes';

const router = Router();

// Mount route modules
router.use('/api', imageRoutes);
router.use('/api/forms', formRoutes);
router.use('/api/forms-data', formDataRoutes);

export default router;
