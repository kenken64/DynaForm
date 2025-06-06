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
}

export const publicFormController = new PublicFormController();
