"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipientController = exports.RecipientController = void 0;
const recipientService_1 = require("../services/recipientService");
class RecipientController {
    async createRecipient(req, res) {
        try {
            const recipientData = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    message: 'User ID not found in request'
                });
                return;
            }
            const result = await recipientService_1.recipientService.createRecipient(recipientData, userId);
            res.status(201).json({
                success: true,
                message: 'Recipient created successfully',
                recipient: result
            });
        }
        catch (error) {
            console.error('Error creating recipient:', error);
            if (error.message.includes('already exists') ||
                error.message.includes('Invalid email') ||
                error.message.includes('is required')) {
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: error.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to create recipient',
                    message: 'An unexpected error occurred'
                });
            }
        }
    }
    async getRecipients(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const search = req.query.search;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    message: 'User ID not found in request'
                });
                return;
            }
            const result = await recipientService_1.recipientService.getRecipients(page, pageSize, userId, search);
            // Transform response to match frontend interface
            res.status(200).json({
                success: result.success,
                recipients: result.data,
                totalCount: result.count,
                page: result.page,
                pageSize: result.pageSize,
                totalPages: result.totalPages
            });
        }
        catch (error) {
            console.error('Error retrieving recipients:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve recipients',
                message: error.message
            });
        }
    }
    async getRecipient(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    message: 'User ID not found in request'
                });
                return;
            }
            const recipient = await recipientService_1.recipientService.getRecipient(id, userId);
            res.status(200).json({
                success: true,
                recipient: recipient
            });
        }
        catch (error) {
            console.error('Error retrieving recipient:', error);
            if (error.message.includes('Invalid') || error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: 'Recipient not found',
                    message: error.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to retrieve recipient',
                    message: 'An unexpected error occurred'
                });
            }
        }
    }
    async updateRecipient(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    message: 'User ID not found in request'
                });
                return;
            }
            const recipient = await recipientService_1.recipientService.updateRecipient(id, updates, userId);
            res.status(200).json({
                success: true,
                message: 'Recipient updated successfully',
                recipient: recipient
            });
        }
        catch (error) {
            console.error('Error updating recipient:', error);
            if (error.message.includes('Invalid') || error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: 'Recipient not found',
                    message: error.message
                });
            }
            else if (error.message.includes('already exists') ||
                error.message.includes('cannot be empty') ||
                error.message.includes('Invalid email')) {
                res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: error.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to update recipient',
                    message: 'An unexpected error occurred'
                });
            }
        }
    }
    async deleteRecipient(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    message: 'User ID not found in request'
                });
                return;
            }
            await recipientService_1.recipientService.deleteRecipient(id, userId);
            res.status(200).json({
                success: true,
                message: 'Recipient deleted successfully'
            });
        }
        catch (error) {
            console.error('Error deleting recipient:', error);
            if (error.message.includes('Invalid') || error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: 'Recipient not found',
                    message: error.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to delete recipient',
                    message: 'An unexpected error occurred'
                });
            }
        }
    }
    async exportRecipients(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    message: 'User ID not found in request'
                });
                return;
            }
            const recipients = await recipientService_1.recipientService.exportRecipients(userId);
            // Convert to CSV format
            const csvHeaders = ['Name', 'Job Title', 'Email', 'Company Name', 'Created At'];
            const csvRows = recipients.map(recipient => [
                recipient.name,
                recipient.jobTitle,
                recipient.email,
                recipient.companyName,
                recipient.createdAt || ''
            ]);
            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
            ].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="recipients.csv"');
            res.status(200).send(csvContent);
        }
        catch (error) {
            console.error('Error exporting recipients:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export recipients',
                message: error.message
            });
        }
    }
}
exports.RecipientController = RecipientController;
exports.recipientController = new RecipientController();
//# sourceMappingURL=recipientController.js.map