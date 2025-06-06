import { Router } from 'express';
import { publicFormController } from '../controllers';

const router = Router();

// GET /api/public/forms - Get public form by formId and jsonFingerprint (no authentication required)
router.get('/forms', publicFormController.getPublicForm);

// GET /api/public/forms/fingerprint/:fingerprint - Get public form by PDF fingerprint (no authentication required)
router.get('/forms/fingerprint/:fingerprint', publicFormController.getFormByPdfFingerprint);

// POST /api/public/forms/submit - Submit public form data (no authentication required)
router.post('/forms/submit', publicFormController.submitPublicForm);

export default router;
