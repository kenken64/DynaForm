import { Request, Response } from 'express';
import { formService } from '../services';
import { SaveFormRequest } from '../types';

export class FormController {
  async saveForm(req: Request, res: Response): Promise<void> {
    try {
      const formRequest: SaveFormRequest = req.body;
      const result = await formService.saveForm(formRequest);

      res.status(200).json({
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
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      const result = await formService.getForms(page, pageSize);

      res.status(200).json({
        success: result.success,
        count: result.count,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        data: result.data
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
      const form = await formService.getFormById(id);

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

    } catch (error: any) {
      console.error('Error retrieving form:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve form', 
        message: error.message 
      });
    }
  }

  async searchForms(req: Request, res: Response): Promise<void> {
    try {
      const searchQuery = req.query.search as string || '';
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      const result = await formService.searchForms(searchQuery, page, pageSize);

      res.status(200).json({
        success: result.success,
        count: result.count,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        forms: result.data,
        searchQuery: searchQuery
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
      const deleted = await formService.deleteForm(id);

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
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete form', 
        message: error.message 
      });
    }
  }

  async updateForm(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const formData = req.body;
      
      const updatedForm = await formService.updateForm(id, formData);

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
        form: updatedForm
      });

    } catch (error: any) {
      console.error('Error updating form:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update form', 
        message: error.message 
      });
    }
  }
}

export const formController = new FormController();