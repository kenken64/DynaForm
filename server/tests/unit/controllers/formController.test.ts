// Unit tests for FormController
import { Request, Response } from 'express';
import { FormController } from '../../../src/controllers/formController';
import { formService } from '../../../src/services';
import { SaveFormRequest, GeneratedForm } from '../../../src/types';

// Mock the services
jest.mock('../../../src/services');

describe('FormController', () => {
  let formController: FormController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockFormService: jest.Mocked<typeof formService>;

  beforeEach(() => {
    formController = new FormController();
    
    mockRequest = {
      body: {},
      params: {},
      query: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Reset all mocks
    jest.clearAllMocks();
    mockFormService = formService as jest.Mocked<typeof formService>;
  });

  describe('saveForm', () => {
    const validFormRequest: SaveFormRequest = {
      formData: [
        { name: 'firstName', type: 'text' },
        { name: 'email', type: 'email' }
      ],
      fieldConfigurations: {
        firstName: { mandatory: true, validation: true },
        email: { mandatory: true, validation: true }
      },
      metadata: { formName: 'Test Form' }
    };

    it('should successfully save a form', async () => {
      mockRequest.body = validFormRequest;
      mockFormService.saveForm.mockResolvedValue({
        formId: 'form123',
        savedAt: '2024-01-01T00:00:00Z'
      });

      await formController.saveForm(mockRequest as Request, mockResponse as Response);

      expect(mockFormService.saveForm).toHaveBeenCalledWith(validFormRequest);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Form saved successfully',
        data: {
          formId: 'form123',
          savedAt: '2024-01-01T00:00:00Z'
        }
      });
    });

    it('should handle form save errors', async () => {
      mockRequest.body = validFormRequest;
      mockFormService.saveForm.mockRejectedValue(new Error('Invalid form data'));

      await formController.saveForm(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to save form',
        message: 'Invalid form data'
      });
    });
  });

  describe('getForms', () => {
    const mockFormsResponse = {
      success: true,
      count: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      data: [
        { 
          _id: 'form1', 
          formData: [], 
          fieldConfigurations: {},
          metadata: { formName: 'Form 1', createdAt: '2024-01-01T00:00:00Z', version: '1.0.0' } 
        },
        { 
          _id: 'form2', 
          formData: [], 
          fieldConfigurations: {},
          metadata: { formName: 'Form 2', createdAt: '2024-01-01T00:00:00Z', version: '1.0.0' } 
        }
      ] as GeneratedForm[]
    };

    it('should successfully get forms with default pagination', async () => {
      mockFormService.getForms.mockResolvedValue(mockFormsResponse);

      await formController.getForms(mockRequest as Request, mockResponse as Response);

      expect(mockFormService.getForms).toHaveBeenCalledWith(1, 10);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: mockFormsResponse.success,
        count: mockFormsResponse.count,
        page: mockFormsResponse.page,
        pageSize: mockFormsResponse.pageSize,
        totalPages: mockFormsResponse.totalPages,
        data: mockFormsResponse.data
      });
    });

    it('should handle custom pagination parameters', async () => {
      mockRequest.query = { page: '2', pageSize: '5' };
      mockFormService.getForms.mockResolvedValue(mockFormsResponse);

      await formController.getForms(mockRequest as Request, mockResponse as Response);

      expect(mockFormService.getForms).toHaveBeenCalledWith(2, 5);
    });

    it('should handle get forms errors', async () => {
      mockFormService.getForms.mockRejectedValue(new Error('Database error'));

      await formController.getForms(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve forms',
        message: 'Database error'
      });
    });
  });

  describe('getFormById', () => {
    const mockForm: GeneratedForm = {
      _id: 'form123',
      formData: [{ name: 'firstName', type: 'text' }],
      fieldConfigurations: { firstName: { mandatory: true, validation: true } },
      metadata: { formName: 'Test Form', createdAt: '2024-01-01T00:00:00Z', version: '1.0.0' }
    };

    it('should successfully get a form by ID', async () => {
      mockRequest.params = { id: 'form123' };
      mockFormService.getFormById.mockResolvedValue(mockForm);

      await formController.getFormById(mockRequest as Request, mockResponse as Response);

      expect(mockFormService.getFormById).toHaveBeenCalledWith('form123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        form: mockForm
      });
    });

    it('should return 404 when form not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockFormService.getFormById.mockResolvedValue(null);

      await formController.getFormById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Form not found',
        message: 'No form found with ID: nonexistent'
      });
    });

    it('should handle invalid ObjectId errors', async () => {
      mockRequest.params = { id: 'invalid-id' };
      mockFormService.getFormById.mockRejectedValue(new Error('Invalid ObjectId'));

      await formController.getFormById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve form',
        message: 'Invalid ObjectId'
      });
    });
  });

  describe('searchForms', () => {
    const mockSearchResponse = {
      success: true,
      count: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      data: [
        { 
          _id: 'form1', 
          formData: [], 
          fieldConfigurations: {},
          metadata: { formName: 'Contact Form', createdAt: '2024-01-01T00:00:00Z', version: '1.0.0' } 
        }
      ] as GeneratedForm[]
    };

    it('should successfully search forms', async () => {
      mockRequest.query = { search: 'contact', page: '1', pageSize: '10' };
      mockFormService.searchForms.mockResolvedValue(mockSearchResponse);

      await formController.searchForms(mockRequest as Request, mockResponse as Response);

      expect(mockFormService.searchForms).toHaveBeenCalledWith('contact', 1, 10);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: mockSearchResponse.success,
        count: mockSearchResponse.count,
        page: mockSearchResponse.page,
        pageSize: mockSearchResponse.pageSize,
        totalPages: mockSearchResponse.totalPages,
        forms: mockSearchResponse.data,
        searchQuery: 'contact'
      });
    });

    it('should handle empty search query', async () => {
      mockRequest.query = {};
      mockFormService.searchForms.mockResolvedValue(mockSearchResponse);

      await formController.searchForms(mockRequest as Request, mockResponse as Response);

      expect(mockFormService.searchForms).toHaveBeenCalledWith('', 1, 10);
    });

    it('should handle search errors', async () => {
      mockRequest.query = { search: 'contact' };
      mockFormService.searchForms.mockRejectedValue(new Error('Search failed'));

      await formController.searchForms(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to search forms',
        message: 'Search failed'
      });
    });
  });

  describe('deleteForm', () => {
    it('should successfully delete a form', async () => {
      mockRequest.params = { id: 'form123' };
      mockFormService.deleteForm.mockResolvedValue(true);

      await formController.deleteForm(mockRequest as Request, mockResponse as Response);

      expect(mockFormService.deleteForm).toHaveBeenCalledWith('form123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Form deleted successfully'
      });
    });

    it('should return 404 when form not found for deletion', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockFormService.deleteForm.mockResolvedValue(false);

      await formController.deleteForm(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Form not found',
        message: 'No form found with ID: nonexistent'
      });
    });

    it('should handle delete errors', async () => {
      mockRequest.params = { id: 'invalid-id' };
      mockFormService.deleteForm.mockRejectedValue(new Error('Delete failed'));

      await formController.deleteForm(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to delete form',
        message: 'Delete failed'
      });
    });
  });
});
