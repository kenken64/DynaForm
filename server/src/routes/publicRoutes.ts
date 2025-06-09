import { Router } from 'express';
import { publicFormController } from '../controllers';

const router = Router();

// GET /api/public/forms - Get public form by formId and jsonFingerprint (no authentication required)
router.get('/forms', publicFormController.getPublicForm);

// GET /api/public/forms/fingerprint/:fingerprint - Get public form by PDF fingerprint (no authentication required)
router.get('/forms/fingerprint/:fingerprint', publicFormController.getFormByPdfFingerprint);

// POST /api/public/forms/submit - Submit public form data (no authentication required)
router.post('/forms/submit', publicFormController.submitPublicForm);

// GET /api/public/submissions - Get all public form submissions with pagination and search (no authentication required)
router.get('/submissions', publicFormController.getPublicSubmissions);

// GET /api/public/export-submissions - Export public submissions to Excel (optional formId query param)
router.get('/export-submissions', publicFormController.exportPublicSubmissions);

// GET /api/public/submissions/aggregated - Get aggregated public submissions data by form (no authentication required)
router.get('/submissions/aggregated', publicFormController.getAggregatedPublicSubmissions);

// GET /api/public/submissions/user/:userId - Get public submissions for a specific user (no authentication required)
router.get('/submissions/user/:userId', publicFormController.getUserPublicSubmissions);

// GET /api/public/submissions/user/:userId/forms - Get aggregated public forms for a specific user (no authentication required)
router.get('/submissions/user/:userId/forms', publicFormController.getUserPublicFormsAggregated);

// GET /api/public/submissions/:formId - Get public submissions for a specific form (no authentication required)
router.get('/submissions/:formId', publicFormController.getPublicSubmissionsByForm);

export default router;
