import { Request, Response } from 'express';
import { recipientGroupService } from '../services/recipientGroupService';
import { CreateRecipientGroupRequest, UpdateRecipientGroupRequest } from '../types';

export class RecipientGroupController {
  async createRecipientGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupData: CreateRecipientGroupRequest = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in request'
        });
        return;
      }

      const result = await recipientGroupService.createRecipientGroup(groupData, userId);

      res.status(201).json({
        success: true,
        message: 'Recipient group created successfully',
        group: result
      });

    } catch (error: any) {
      console.error('Error creating recipient group:', error);
      
      if (error.message.includes('already exists') || 
          error.message.includes('is required') ||
          error.message.includes('Invalid') ||
          error.message.includes('must be selected') ||
          error.message.includes('do not belong')) {
        res.status(400).json({ 
          success: false,
          error: 'Validation error', 
          message: error.message 
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to create recipient group', 
          message: 'An unexpected error occurred'
        });
      }
    }
  }

  async getRecipientGroups(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in request'
        });
        return;
      }

      const result = await recipientGroupService.getRecipientGroups(page, pageSize, userId, search);

      // Transform response to match frontend interface
      res.status(200).json({
        success: result.success,
        groups: result.data,
        totalCount: result.count,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      });

    } catch (error: any) {
      console.error('Error retrieving recipient groups:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve recipient groups', 
        message: error.message 
      });
    }
  }

  async getRecipientGroup(req: Request, res: Response): Promise<void> {
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

      const group = await recipientGroupService.getRecipientGroup(id, userId);

      res.status(200).json({
        success: true,
        group: group
      });

    } catch (error: any) {
      console.error('Error retrieving recipient group:', error);
      
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        res.status(404).json({ 
          success: false,
          error: 'Recipient group not found', 
          message: error.message 
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to retrieve recipient group', 
          message: 'An unexpected error occurred'
        });
      }
    }
  }

  async updateRecipientGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateRecipientGroupRequest = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in request'
        });
        return;
      }

      const group = await recipientGroupService.updateRecipientGroup(id, updates, userId);

      res.status(200).json({
        success: true,
        message: 'Recipient group updated successfully',
        group: group
      });

    } catch (error: any) {
      console.error('Error updating recipient group:', error);
      
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        res.status(404).json({ 
          success: false,
          error: 'Recipient group not found', 
          message: error.message 
        });
      } else if (error.message.includes('already exists') || 
                 error.message.includes('is required') ||
                 error.message.includes('do not belong')) {
        res.status(400).json({ 
          success: false,
          error: 'Validation error', 
          message: error.message 
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to update recipient group', 
          message: 'An unexpected error occurred'
        });
      }
    }
  }

  async deleteRecipientGroup(req: Request, res: Response): Promise<void> {
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

      await recipientGroupService.deleteRecipientGroup(id, userId);

      res.status(200).json({
        success: true,
        message: 'Recipient group deleted successfully'
      });

    } catch (error: any) {
      console.error('Error deleting recipient group:', error);
      
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        res.status(404).json({ 
          success: false,
          error: 'Recipient group not found', 
          message: error.message 
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: 'Failed to delete recipient group', 
          message: 'An unexpected error occurred'
        });
      }
    }
  }

  async searchByAlias(req: Request, res: Response): Promise<void> {
    try {
      const { alias } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User ID not found in request'
        });
        return;
      }

      if (!alias || typeof alias !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Alias parameter is required'
        });
        return;
      }

      const groups = await recipientGroupService.searchByAlias(alias, userId);

      res.status(200).json({
        success: true,
        groups: groups
      });

    } catch (error: any) {
      console.error('Error searching recipient groups by alias:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to search recipient groups', 
        message: error.message 
      });
    }
  }

  async getGroupsWithRecipients(req: Request, res: Response): Promise<void> {
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

      const groups = await recipientGroupService.getGroupsWithRecipients(userId);

      res.status(200).json({
        success: true,
        groups: groups
      });

    } catch (error: any) {
      console.error('Error retrieving groups with recipients:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve groups with recipients', 
        message: error.message 
      });
    }
  }

  async exportRecipientGroups(req: Request, res: Response): Promise<void> {
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

      const groups = await recipientGroupService.getGroupsWithRecipients(userId);

      // Convert to CSV format
      const csvHeaders = ['Alias Name', 'Description', 'Recipient Count', 'Recipients', 'Created At'];
      const csvRows = groups.map(group => [
        group.aliasName,
        group.description || '',
        group.recipients.length.toString(),
        group.recipients.map((r: any) => `${r.name} (${r.email})`).join('; '),
        group.createdAt || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="recipient-groups.csv"');
      res.status(200).send(csvContent);

    } catch (error: any) {
      console.error('Error exporting recipient groups:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to export recipient groups', 
        message: error.message 
      });
    }
  }
}

export const recipientGroupController = new RecipientGroupController();
