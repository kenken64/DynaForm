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
            console.log('Retrieving form data for formId:', formId, 'and userId:', userId);
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
    async getAllFormData(req, res) {
        try {
            const { formId } = req.query;
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const result = await services_1.formDataService.getAllFormData(formId, page, pageSize);
            res.status(200).json({
                success: result.success,
                count: result.count,
                page: result.page,
                pageSize: result.pageSize,
                totalPages: result.totalPages,
                data: result.data
            });
        }
        catch (error) {
            console.error('Error retrieving all form data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve form data',
                message: error.message
            });
        }
    }
    async deleteFormData(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    error: 'Form data ID is required'
                });
                return;
            }
            const deleted = await services_1.formDataService.deleteFormData(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Form data not found',
                    message: `No form data found with ID: ${id}`
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Form data deleted successfully'
            });
        }
        catch (error) {
            console.error('Error deleting form data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete form data',
                message: error.message
            });
        }
    }
    async searchFormData(req, res) {
        try {
            const searchQuery = req.query.search || '';
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const result = await services_1.formDataService.searchFormData(searchQuery, page, pageSize);
            res.status(200).json({
                success: result.success,
                count: result.count,
                page: result.page,
                pageSize: result.pageSize,
                totalPages: result.totalPages,
                submissions: result.data,
                searchQuery: searchQuery
            });
        }
        catch (error) {
            console.error('Error searching form data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search form data',
                message: error.message
            });
        }
    }
}
exports.FormDataController = FormDataController;
exports.formDataController = new FormDataController();
//# sourceMappingURL=formDataController.js.map