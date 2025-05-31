"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formController = exports.FormController = void 0;
const services_1 = require("../services");
class FormController {
    async saveForm(req, res) {
        try {
            const formRequest = req.body;
            const result = await services_1.formService.saveForm(formRequest);
            res.status(201).json({
                success: true,
                message: 'Form saved successfully',
                formId: result.formId,
                savedAt: result.savedAt
            });
        }
        catch (error) {
            console.error('Error saving form:', error);
            res.status(400).json({
                success: false,
                error: 'Failed to save form',
                message: error.message
            });
        }
    }
    async getForms(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const result = await services_1.formService.getForms(page, pageSize);
            res.status(200).json({
                success: result.success,
                count: result.count,
                page: result.page,
                pageSize: result.pageSize,
                totalPages: result.totalPages,
                forms: result.data
            });
        }
        catch (error) {
            console.error('Error retrieving forms:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve forms',
                message: error.message
            });
        }
    }
    async getFormById(req, res) {
        try {
            const { id } = req.params;
            const form = await services_1.formService.getFormById(id);
            if (!form) {
                res.status(404).json({
                    success: false,
                    error: 'Form not found',
                    message: `No form found with ID: ${id}`
                });
                return;
            }
            res.status(200).json({
                success: true,
                form: form
            });
        }
        catch (error) {
            console.error('Error retrieving form:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve form',
                message: error.message
            });
        }
    }
    async searchForms(req, res) {
        try {
            const searchQuery = req.query.search || '';
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const result = await services_1.formService.searchForms(searchQuery, page, pageSize);
            res.status(200).json({
                success: result.success,
                count: result.count,
                page: result.page,
                pageSize: result.pageSize,
                totalPages: result.totalPages,
                forms: result.data,
                searchQuery: searchQuery
            });
        }
        catch (error) {
            console.error('Error searching forms:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search forms',
                message: error.message
            });
        }
    }
    async deleteForm(req, res) {
        try {
            const { id } = req.params;
            const deleted = await services_1.formService.deleteForm(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Form not found',
                    message: `No form found with ID: ${id}`
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Form deleted successfully'
            });
        }
        catch (error) {
            console.error('Error deleting form:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete form',
                message: error.message
            });
        }
    }
}
exports.FormController = FormController;
exports.formController = new FormController();
//# sourceMappingURL=formController.js.map