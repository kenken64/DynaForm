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
}
exports.PublicFormController = PublicFormController;
exports.publicFormController = new PublicFormController();
//# sourceMappingURL=publicFormController.js.map