"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formDataController = exports.FormDataController = void 0;
const services_1 = require("../services");
class FormDataController {
    async saveFormData(req, res) {
        try {
            const formDataSubmission = req.body;
            const requestInfo = {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            };
            const result = await services_1.formDataService.saveFormData(formDataSubmission, requestInfo);
            res.status(result.isNewSubmission ? 201 : 200).json({
                success: true,
                message: result.isNewSubmission ? 'Form data saved successfully' : 'Form data updated successfully',
                formId: formDataSubmission.formId,
                isNewSubmission: result.isNewSubmission,
                submittedAt: result.submittedAt
            });
        }
        catch (error) {
            console.error('Error saving form data:', error);
            res.status(400).json({
                success: false,
                error: 'Failed to save form data',
                message: error.message
            });
        }
    }
    async getFormData(req, res) {
        try {
            const { formId } = req.params;
            const { userId } = req.query;
            const formData = await services_1.formDataService.getFormData(formId, userId);
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
                formData: formData
            });
        }
        catch (error) {
            console.error('Error retrieving form data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve form data',
                message: error.message
            });
        }
    }
    async getFormSubmissions(req, res) {
        try {
            const { formId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const result = await services_1.formDataService.getFormSubmissions(formId, page, pageSize);
            res.status(200).json({
                success: result.success,
                count: result.count,
                page: result.page,
                pageSize: result.pageSize,
                totalPages: result.totalPages,
                submissions: result.data
            });
        }
        catch (error) {
            console.error('Error retrieving form submissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve form submissions',
                message: error.message
            });
        }
    }
}
exports.FormDataController = FormDataController;
exports.formDataController = new FormDataController();
//# sourceMappingURL=formDataController.js.map