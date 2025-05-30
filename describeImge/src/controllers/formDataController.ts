import { Request, Response } from 'express';
import { FormDataService } from '../services';
import { PaginationQuery } from '../types';

export class FormDataController {
    private formDataService: FormDataService;

    constructor() {
        this.formDataService = new FormDataService();
    }

    async saveFormData(req: Request, res: Response): Promise<void> {
        try {
            const { formId, formData, formTitle, userInfo, submissionMetadata } = req.body;

            const result = await this.formDataService.saveFormData({
                formId,
                formData,
                formTitle,
                userInfo,
                submissionMetadata,
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown'
            });

            res.status(result.isNewSubmission ? 201 : 200).json({
                success: true,
                message: result.isNewSubmission ? 'Form data saved successfully' : 'Form data updated successfully',
                data: {
                    formId: formId,
                    isNewSubmission: result.isNewSubmission,
                    submittedAt: result.submittedAt
                }
            });

        } catch (error: any) {
            console.error('Error saving form data:', error);
            res.status(400).json({
                success: false,
                error: 'Failed to save form data',
                message: error.message
            });
        }
    }

    async getFormData(req: Request, res: Response): Promise<void> {
        try {
            const { formId } = req.params;
            const { userId } = req.query;

            const formData = await this.formDataService.getFormData(formId, userId as string);

            if (!formData) {
                res.status(404).json({
                    success: false,
                    error: 'Form data not found',
                    message: `No form data found for form ID: ${formId}`
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: formData
            });

        } catch (error: any) {
            console.error('Error retrieving form data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve form data',
                message: error.message
            });
        }
    }

    async getFormSubmissions(req: Request, res: Response): Promise<void> {
        try {
            const { formId } = req.params;
            const query: PaginationQuery = req.query;

            const result = await this.formDataService.getFormSubmissions(formId, query);

            res.status(200).json({
                success: true,
                data: result.submissions,
                pagination: {
                    count: result.totalCount,
                    page: result.page,
                    pageSize: result.pageSize,
                    totalPages: result.totalPages
                }
            });

        } catch (error: any) {
            console.error('Error retrieving form submissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve form submissions',
                message: error.message
            });
        }
    }

    async deleteFormData(req: Request, res: Response): Promise<void> {
        try {
            const { formId } = req.params;
            const { userId } = req.query;

            const deleted = await this.formDataService.deleteFormData(formId, userId as string);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Form data not found',
                    message: `No form data found for form ID: ${formId}`
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Form data deleted successfully'
            });

        } catch (error: any) {
            console.error('Error deleting form data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete form data',
                message: error.message
            });
        }
    }

    async deleteAllFormSubmissions(req: Request, res: Response): Promise<void> {
        try {
            const { formId } = req.params;

            const deletedCount = await this.formDataService.deleteAllFormSubmissions(formId);

            res.status(200).json({
                success: true,
                message: `Deleted ${deletedCount} form submissions`,
                data: {
                    deletedCount
                }
            });

        } catch (error: any) {
            console.error('Error deleting form submissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete form submissions',
                message: error.message
            });
        }
    }
}
