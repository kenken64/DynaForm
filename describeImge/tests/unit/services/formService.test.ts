// Unit tests for FormService
import { FormService } from '../../../src/services/formService';
import { SaveFormRequest, GeneratedForm, FormField } from '../../../src/types';
import { getDatabase } from '../../../src/database/connection';
import { Collection, ObjectId } from 'mongodb';

// Mock the database connection
jest.mock('../../../src/database/connection');

describe('FormService', () => {
  let formService: FormService;
  let mockCollection: jest.Mocked<Collection<GeneratedForm>>;
  let mockDatabase: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock collection
    mockCollection = {
      insertOne: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
    } as any;

    // Mock database
    mockDatabase = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    // Mock the getDatabase function
    (getDatabase as jest.Mock).mockReturnValue(mockDatabase);

    formService = new FormService();
  });

  describe('saveForm', () => {
    const mockFormData: FormField[] = [
      {
        name: 'firstName',
        type: 'text',
        value: '',
        configuration: { mandatory: true, validation: true }
      },
      {
        name: 'email',
        type: 'email',
        value: '',
        configuration: { mandatory: true, validation: true }
      }
    ];

    const mockFieldConfigurations = {
      firstName: { mandatory: true, validation: true },
      email: { mandatory: true, validation: true }
    };

    const validFormRequest: SaveFormRequest = {
      formData: mockFormData,
      fieldConfigurations: mockFieldConfigurations,
      originalJson: { test: 'data' },
      metadata: {
        formName: 'Test Form',
        version: '1.0.0'
      }
    };

    it('should successfully save a form', async () => {
      const mockInsertedId = new ObjectId();
      mockCollection.insertOne.mockResolvedValue({
        insertedId: mockInsertedId,
        acknowledged: true
      } as any);

      const result = await formService.saveForm(validFormRequest);

      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          formData: mockFormData,
          fieldConfigurations: mockFieldConfigurations,
          originalJson: { test: 'data' },
          metadata: expect.objectContaining({
            formName: 'Test Form',
            version: '1.0.0',
            createdAt: expect.any(String)
          })
        })
      );

      expect(result).toEqual({
        formId: mockInsertedId.toString(),
        savedAt: expect.any(String)
      });
    });

    it('should use default form name when not provided', async () => {
      const mockInsertedId = new ObjectId();
      mockCollection.insertOne.mockResolvedValue({
        insertedId: mockInsertedId,
        acknowledged: true
      } as any);

      const requestWithoutFormName = {
        ...validFormRequest,
        metadata: undefined
      };

      await formService.saveForm(requestWithoutFormName);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            formName: 'Untitled Form',
            version: '1.0.0'
          })
        })
      );
    });

    it('should throw error for invalid form data', async () => {
      const invalidRequest = {
        ...validFormRequest,
        formData: null as any
      };

      await expect(formService.saveForm(invalidRequest))
        .rejects.toThrow('Invalid form data. Expected formData to be an array.');

      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should throw error for invalid field configurations', async () => {
      const invalidRequest = {
        ...validFormRequest,
        fieldConfigurations: null as any
      };

      await expect(formService.saveForm(invalidRequest))
        .rejects.toThrow('Invalid field configurations. Expected fieldConfigurations to be an object.');

      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockCollection.insertOne.mockRejectedValue(new Error('Database error'));

      await expect(formService.saveForm(validFormRequest))
        .rejects.toThrow('Database error');
    });
  });

  describe('getForms', () => {
    it('should retrieve paginated forms', async () => {
      const mockForms: GeneratedForm[] = [
        {
          _id: new ObjectId(),
          formData: [],
          fieldConfigurations: {},
          metadata: {
            createdAt: '2024-01-01T00:00:00Z',
            formName: 'Form 1',
            version: '1.0.0'
          }
        },
        {
          _id: new ObjectId(),
          formData: [],
          fieldConfigurations: {},
          metadata: {
            createdAt: '2024-01-02T00:00:00Z',
            formName: 'Form 2',
            version: '1.0.0'
          }
        }
      ];

      mockCollection.countDocuments.mockResolvedValue(25);
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(mockForms)
            })
          })
        })
      } as any);

      const result = await formService.getForms(2, 10);

      expect(mockCollection.countDocuments).toHaveBeenCalledWith({});
      expect(mockCollection.find).toHaveBeenCalledWith({});
      
      expect(result).toEqual({
        success: true,
        count: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3,
        data: mockForms
      });
    });

    it('should use default pagination values', async () => {
      mockCollection.countDocuments.mockResolvedValue(5);
      mockCollection.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([])
            })
          })
        })
      } as any);

      await formService.getForms();

      const findChain = mockCollection.find().sort({ 'metadata.createdAt': -1 });
      expect(findChain.skip).toHaveBeenCalledWith(0); // (1-1) * 10
      expect(findChain.skip(0).limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getFormById', () => {
    it('should retrieve a form by ID', async () => {
      const mockForm: GeneratedForm = {
        _id: new ObjectId(),
        formData: [],
        fieldConfigurations: {},
        metadata: {
          createdAt: '2024-01-01T00:00:00Z',
          formName: 'Test Form',
          version: '1.0.0'
        }
      };

      mockCollection.findOne.mockResolvedValue(mockForm);

      const result = await formService.getFormById('507f1f77bcf86cd799439011');

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId('507f1f77bcf86cd799439011')
      });

      expect(result).toEqual(mockForm);
    });

    it('should return null when form not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await formService.getFormById('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });

    it('should handle invalid ObjectId', async () => {
      await expect(formService.getFormById('invalid-id'))
        .rejects.toThrow();
    });
  });

  describe('deleteForm', () => {
    it('should successfully delete a form', async () => {
      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 1,
        acknowledged: true
      } as any);

      const result = await formService.deleteForm('507f1f77bcf86cd799439011');

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: new ObjectId('507f1f77bcf86cd799439011')
      });

      expect(result).toBe(true);
    });

    it('should return false when form not found', async () => {
      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 0,
        acknowledged: true
      } as any);

      const result = await formService.deleteForm('507f1f77bcf86cd799439011');

      expect(result).toBe(false);
    });
  });
});
