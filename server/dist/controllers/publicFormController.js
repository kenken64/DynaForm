"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicFormController = exports.PublicFormController = void 0;
const services_1 = require("../services");
class PublicFormController {
    async getPublicForm(req, res) {
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
            const form = await services_1.publicFormService.getPublicForm(formId, jsonFingerprint);
            if (!form) {
                res.status(404).json({
                    success: false,
                    error: 'Form not found',
                    message: 'No form found with the provided ID and fingerprint'
                });
                return;
            }
            res.status(200).json(form);
        }
        catch (error) {
            console.error('Error getting public form:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get form',
                message: error.message
            });
        }
    }
    async getFormByPdfFingerprint(req, res) {
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
            const forms = await services_1.publicFormService.getFormsByPdfFingerprint(fingerprint);
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
        }
        catch (error) {
            console.error('Error getting form by PDF fingerprint:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get form',
                message: error.message
            });
        }
    }
    async submitPublicForm(req, res) {
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
            const result = await services_1.publicFormService.submitPublicForm({
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
        }
        catch (error) {
            console.error('Error submitting public form:', error);
            res.status(400).json({
                success: false,
                error: 'Failed to submit form',
                message: error.message
            });
        }
    }
    async getPublicSubmissions(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const search = req.query.search;
            const result = await services_1.publicFormService.getPublicSubmissions(page, pageSize, search);
            res.status(200).json({
                success: true,
                submissions: result.submissions,
                totalCount: result.totalCount,
                page,
                pageSize,
                totalPages: Math.ceil(result.totalCount / pageSize)
            });
        }
        catch (error) {
            console.error('Error getting public submissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get public submissions',
                message: error.message
            });
        }
    }
    async getPublicSubmissionsByForm(req, res) {
        console.log('🔴 FORM SUBMISSIONS CONTROLLER METHOD CALLED - URL:', req.url, 'Params:', req.params);
        try {
            const { formId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            if (!formId) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid request',
                    message: 'Form ID is required'
                });
                return;
            }
            const result = await services_1.publicFormService.getPublicSubmissionsByForm(formId, page, pageSize);
            res.status(200).json({
                success: true,
                submissions: result.submissions,
                totalCount: result.totalCount,
                page,
                pageSize,
                totalPages: Math.ceil(result.totalCount / pageSize)
            });
        }
        catch (error) {
            console.error('Error getting public submissions by form:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get public submissions',
                message: error.message
            });
        }
    }
    async getAggregatedPublicSubmissions(req, res) {
        try {
            const result = await services_1.publicFormService.getAggregatedPublicSubmissions();
            res.status(200).json({
                success: true,
                aggregatedData: result
            });
        }
        catch (error) {
            console.error('Error getting aggregated public submissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get aggregated public submissions',
                message: error.message
            });
        }
    }
    async getUserPublicSubmissions(req, res) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const search = req.query.search;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid request',
                    message: 'User ID is required'
                });
                return;
            }
            const result = await services_1.publicFormService.getUserPublicSubmissions(userId, page, pageSize, search);
            res.status(200).json({
                success: true,
                submissions: result.submissions,
                totalCount: result.totalCount,
                page,
                pageSize,
                totalPages: Math.ceil(result.totalCount / pageSize)
            });
        }
        catch (error) {
            console.error('Error getting user public submissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get user public submissions',
                message: error.message
            });
        }
    }
    async getUserPublicFormsAggregated(req, res) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const search = req.query.search;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid request',
                    message: 'User ID is required'
                });
                return;
            }
            const result = await services_1.publicFormService.getUserPublicFormsAggregated(userId, page, pageSize, search);
            res.status(200).json({
                success: true,
                forms: result.forms,
                totalCount: result.totalCount,
                page,
                pageSize,
                totalPages: Math.ceil(result.totalCount / pageSize)
            });
        }
        catch (error) {
            console.error('Error getting user aggregated public forms:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get user aggregated public forms',
                message: error.message
            });
        }
    }
    async exportPublicSubmissions(req, res) {
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
            const buffer = await services_1.publicFormService.exportSubmissionsToExcel(formId);
            const filename = formId
                ? `form_${formId}_submissions_${new Date().toISOString().split('T')[0]}.xlsx`
                : `all_public_submissions_${new Date().toISOString().split('T')[0]}.xlsx`;
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString()
            });
            res.status(200).send(buffer);
        }
        catch (error) {
            console.error('Error exporting public submissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export submissions',
                message: error.message
            });
        }
    }
}
exports.PublicFormController = PublicFormController;
exports.publicFormController = new PublicFormController();
//# sourceMappingURL=publicFormController.js.map