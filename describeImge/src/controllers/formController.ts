import { Request, Response } from 'express';
import { FormService } from '../services';
import { SaveFormRequest, PaginationQuery, SearchQuery } from '../types';

export class FormController {
    private formService: FormService;

    constructor() {
        this.formService = new FormService();
    }

    async saveForm(req: Request, res: Response): Promise<void> {
        try {
            const formRequest: SaveFormRequest = req.body;
            const result = await this.formService.saveForm(formRequest);

            res.status(201).json({
                success: true,
                message: 'Form saved successfully',
                data: {
                    formId: result.formId,
                    savedAt: result.savedAt
                }
            });

        } catch (error: any) {
            console.error('Error saving form:', error);
            res.status(400).json({
                success: false,
                error: 'Failed to save form',
                message: error.message
            });
        }
    }

    async getForms(req: Request, res: Response): Promise<void> {
        try {
            const query: PaginationQuery = req.query;
            const result = await this.formService.getForms(query);

            res.status(200).json({
                success: true,
                data: result.forms,
                pagination: {
                    count: result.totalCount,
                    page: result.page,
                    pageSize: result.pageSize,
                    totalPages: result.totalPages
                }
            });

        } catch (error: any) {
            console.error('Error retrieving forms:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve forms',
                message: error.message
            });
        }
    }

    async getFormById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const form = await this.formService.getFormById(id);

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
                data: form
            });

        } catch (error: any) {
            console.error('Error retrieving form:', error);
            const statusCode = error.message.includes('Invalid') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                error: 'Failed to retrieve form',
                message: error.message
            });
        }
    }

    async searchForms(req: Request, res: Response): Promise<void> {
        try {
            const query: SearchQuery = req.query;
            const result = await this.formService.searchForms(query);

            res.status(200).json({
                success: true,
                data: result.forms,
                pagination: {
                    count: result.totalCount,
                    page: result.page,
                    pageSize: result.pageSize,
                    totalPages: result.totalPages
                },
                searchQuery: result.searchQuery
            });

        } catch (error: any) {
            console.error('Error searching forms:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search forms',
                message: error.message
            });
        }
    }

    async deleteForm(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const deleted = await this.formService.deleteForm(id);

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

        } catch (error: any) {
            console.error('Error deleting form:', error);
            const statusCode = error.message.includes('Invalid') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                error: 'Failed to delete form',
                message: error.message
            });
        }
    }

    async updateForm(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            const updatedForm = await this.formService.updateForm(id, updateData);

            if (!updatedForm) {
                res.status(404).json({
                    success: false,
                    error: 'Form not found',
                    message: `No form found with ID: ${id}`
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Form updated successfully',
                data: updatedForm
            });

        } catch (error: any) {
            console.error('Error updating form:', error);
            const statusCode = error.message.includes('Invalid') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                error: 'Failed to update form',
                message: error.message
            });
        }
    }
}
