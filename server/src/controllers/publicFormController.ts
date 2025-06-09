import { Request, Response } from 'express';
import { publicFormService } from '../services';

export class PublicFormController {
  async getPublicForm(req: Request, res: Response): Promise<void> {
    try {
      const { formId, jsonFingerprint } = req.query;

      if (!formId || !jsonFingerprint) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Both formId and jsonFingerprint are required'
        });
        return;
      }

      // Validate formId format
      if (typeof formId !== 'string' || formId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(formId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid formId format',
          message: 'formId must be a valid 24-character MongoDB ObjectId'
        });
        return;
      }

      const form = await publicFormService.getPublicForm(formId as string, jsonFingerprint as string);

      if (!form) {
        res.status(404).json({
          success: false,
          error: 'Form not found',
          message: 'No form found with the provided ID and fingerprint'
        });
        return;
      }

      res.status(200).json(form);

    } catch (error: any) {
      console.error('Error getting public form:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get form', 
        message: error.message 
      });
    }
  }

  async getFormByPdfFingerprint(req: Request, res: Response): Promise<void> {
    try {
      const { fingerprint } = req.params;

      if (!fingerprint) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'PDF fingerprint is required'
        });
        return;
      }

      const forms = await publicFormService.getFormsByPdfFingerprint(fingerprint);

      if (!forms || forms.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Forms not found',
          message: 'No forms found with the provided PDF fingerprint'
        });
        return;
      }

      // Return the first form if multiple are found
      res.status(200).json(forms[0]);

    } catch (error: any) {
      console.error('Error getting form by PDF fingerprint:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get form', 
        message: error.message 
      });
    }
  }

  async submitPublicForm(req: Request, res: Response): Promise<void> {
    try {
      const { formId, jsonFingerprint, submissionData, submittedAt } = req.body;

      if (!formId || !jsonFingerprint || !submissionData) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'formId, jsonFingerprint, and submissionData are required'
        });
        return;
      }

      // Validate formId format  
      if (typeof formId !== 'string' || formId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(formId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid formId format',
          message: 'formId must be a valid 24-character MongoDB ObjectId'
        });
        return;
      }

      const result = await publicFormService.submitPublicForm({
        formId,
        jsonFingerprint,
        submissionData,
        submittedAt: submittedAt || new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: 'Form submitted successfully',
        data: {
          submissionId: result.submissionId,
          submittedAt: result.submittedAt
        }
      });

    } catch (error: any) {
      console.error('Error submitting public form:', error);
      res.status(400).json({ 
        success: false,
        error: 'Failed to submit form', 
        message: error.message 
      });
    }
  }

  async getPublicSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string;

      const result = await publicFormService.getPublicSubmissions(page, pageSize, search);

      res.status(200).json({
        success: true,
        submissions: result.submissions,
        totalCount: result.totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(result.totalCount / pageSize)
      });

    } catch (error: any) {
      console.error('Error getting public submissions:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get public submissions', 
        message: error.message 
      });
    }
  }

  async getPublicSubmissionsByForm(req: Request, res: Response): Promise<void> {
    console.log('🔴 FORM SUBMISSIONS CONTROLLER METHOD CALLED - URL:', req.url, 'Params:', req.params);
    try {
      const { formId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      if (!formId) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Form ID is required'
        });
        return;
      }

      const result = await publicFormService.getPublicSubmissionsByForm(formId, page, pageSize);

      res.status(200).json({
        success: true,
        submissions: result.submissions,
        totalCount: result.totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(result.totalCount / pageSize)
      });

    } catch (error: any) {
      console.error('Error getting public submissions by form:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get public submissions', 
        message: error.message 
      });
    }
  }

  async getAggregatedPublicSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const result = await publicFormService.getAggregatedPublicSubmissions();

      res.status(200).json({
        success: true,
        aggregatedData: result
      });

    } catch (error: any) {
      console.error('Error getting aggregated public submissions:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get aggregated public submissions', 
        message: error.message 
      });
    }
  }

  async getUserPublicSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'User ID is required'
        });
        return;
      }

      const result = await publicFormService.getUserPublicSubmissions(userId, page, pageSize, search);

      res.status(200).json({
        success: true,
        submissions: result.submissions,
        totalCount: result.totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(result.totalCount / pageSize)
      });

    } catch (error: any) {
      console.error('Error getting user public submissions:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get user public submissions', 
        message: error.message 
      });
    }
  }

  async getUserPublicFormsAggregated(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'User ID is required'
        });
        return;
      }

      const result = await publicFormService.getUserPublicFormsAggregated(userId, page, pageSize, search);

      res.status(200).json({
        success: true,
        forms: result.forms,
        totalCount: result.totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(result.totalCount / pageSize)
      });

    } catch (error: any) {
      console.error('Error getting user aggregated public forms:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to get user aggregated public forms', 
        message: error.message 
      });
    }
  }

  async exportPublicSubmissions(req: Request, res: Response): Promise<void> {
    console.log('🎯 EXPORT CONTROLLER METHOD CALLED - URL:', req.url, 'Query:', req.query);
    try {
      const { formId } = req.query;

      if (formId && (typeof formId !== 'string' || formId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(formId))) {
        res.status(400).json({
          success: false,
          error: 'Invalid formId format',
          message: 'formId must be a valid 24-character MongoDB ObjectId'
        });
        return;
      }

      const buffer = await publicFormService.exportSubmissionsToExcel(formId as string);

      const filename = formId 
        ? `form_${formId}_submissions_${new Date().toISOString().split('T')[0]}.xlsx`
        : `all_public_submissions_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      });

      res.status(200).send(buffer);

    } catch (error: any) {
      console.error('Error exporting public submissions:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to export submissions', 
        message: error.message 
      });
    }
  }
}

export const publicFormController = new PublicFormController();
