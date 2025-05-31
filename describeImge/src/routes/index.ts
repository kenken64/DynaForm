import { Router } from 'express';
import imageRoutes from './imageRoutes';
import formRoutes from './formRoutes';
import formDataRoutes from './formDataRoutes';

const router = Router();

// Mount routes
router.use('/', imageRoutes);        // Health check and image description
router.use('/api/forms', formRoutes);
router.use('/api/form-data', formDataRoutes);  // Fixed path

export default router;