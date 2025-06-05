// Unit tests for validation utilities
import { ObjectId } from 'mongodb';
import { 
  isValidObjectId, 
  validateRequiredFields, 
  sanitizeSearchQuery, 
  validateFormData 
} from '../../../src/utils/validation';

describe('Validation Utils', () => {
  describe('isValidObjectId', () => {
    it('should return true for valid ObjectId strings', () => {
      const validId = new ObjectId().toString();
      expect(isValidObjectId(validId)).toBe(true);
    });

    it('should return true for valid 24-character hex strings', () => {
      expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });

    it('should return false for invalid ObjectId strings', () => {
      expect(isValidObjectId('invalid-id')).toBe(false);
      expect(isValidObjectId('123')).toBe(false);
      expect(isValidObjectId('')).toBe(false);
      expect(isValidObjectId('507f1f77bcf86cd79943901g')).toBe(false); // invalid hex
    });

    it('should return false for non-string inputs', () => {
      expect(isValidObjectId(null as any)).toBe(false);
      expect(isValidObjectId(undefined as any)).toBe(false);
      expect(isValidObjectId(123 as any)).toBe(false);
    });
  });

  describe('validateRequiredFields', () => {
    it('should return empty array when all required fields are present', () => {
      const data = {
        name: 'John',
        email: 'john@example.com',
        age: 30
      };
      const requiredFields = ['name', 'email'];

      const result = validateRequiredFields(data, requiredFields);
      expect(result).toEqual([]);
    });

    it('should return missing field names', () => {
      const data = {
        name: 'John',
        age: 30
      };
      const requiredFields = ['name', 'email', 'phone'];

      const result = validateRequiredFields(data, requiredFields);
      expect(result).toEqual(['email', 'phone']);
    });

    it('should identify null values as missing', () => {
      const data = {
        name: 'John',
        email: null,
        phone: undefined
      };
      const requiredFields = ['name', 'email', 'phone'];

      const result = validateRequiredFields(data, requiredFields);
      expect(result).toEqual(['email', 'phone']);
    });

    it('should identify empty strings as missing', () => {
      const data = {
        name: '',
        email: 'john@example.com'
      };
      const requiredFields = ['name', 'email'];

      const result = validateRequiredFields(data, requiredFields);
      expect(result).toEqual(['name']);
    });

    it('should handle empty required fields array', () => {
      const data = { name: 'John' };
      const requiredFields: string[] = [];

      const result = validateRequiredFields(data, requiredFields);
      expect(result).toEqual([]);
    });

    it('should handle empty data object', () => {
      const data = {};
      const requiredFields = ['name', 'email'];

      const result = validateRequiredFields(data, requiredFields);
      expect(result).toEqual(['name', 'email']);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should escape special regex characters', () => {
      const query = 'test.*+?^${}()|[]\\';
      const expected = 'test\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\';

      const result = sanitizeSearchQuery(query);
      expect(result).toBe(expected);
    });

    it('should leave normal characters unchanged', () => {
      const query = 'normal search text 123';
      const result = sanitizeSearchQuery(query);
      expect(result).toBe(query);
    });

    it('should handle empty string', () => {
      const result = sanitizeSearchQuery('');
      expect(result).toBe('');
    });

    it('should handle mixed content', () => {
      const query = 'search (with) special.chars';
      const expected = 'search \\(with\\) special\\.chars';

      const result = sanitizeSearchQuery(query);
      expect(result).toBe(expected);
    });
  });

  describe('validateFormData', () => {
    it('should validate correct form data', () => {
      const formData = [
        { name: 'firstName', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'age', type: 'number' }
      ];

      const result = validateFormData(formData);
      expect(result).toEqual({
        isValid: true,
        errors: []
      });
    });

    it('should reject non-array input', () => {
      const formData = { name: 'test' };

      const result = validateFormData(formData as any);
      expect(result).toEqual({
        isValid: false,
        errors: ['Form data must be an array']
      });
    });

    it('should identify fields with missing names', () => {
      const formData = [
        { name: 'firstName', type: 'text' },
        { type: 'email' }, // missing name
        { name: '', type: 'number' } // empty name
      ];

      const result = validateFormData(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Field at index 1 must have a valid name');
      expect(result.errors).toContain('Field at index 2 must have a valid name');
    });

    it('should identify fields with missing types', () => {
      const formData = [
        { name: 'firstName', type: 'text' },
        { name: 'email' }, // missing type
        { name: 'age', type: '' } // empty type
      ];

      const result = validateFormData(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Field at index 1 must have a valid type');
      expect(result.errors).toContain('Field at index 2 must have a valid type');
    });

    it('should identify multiple validation errors', () => {
      const formData = [
        { name: 'firstName', type: 'text' },
        { type: 'email' }, // missing name
        { name: 'age' }, // missing type
        {} // missing both
      ];

      const result = validateFormData(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain('Field at index 1 must have a valid name');
      expect(result.errors).toContain('Field at index 2 must have a valid type');
      expect(result.errors).toContain('Field at index 3 must have a valid name');
      expect(result.errors).toContain('Field at index 3 must have a valid type');
    });

    it('should handle empty array', () => {
      const result = validateFormData([]);
      expect(result).toEqual({
        isValid: true,
        errors: []
      });
    });

    it('should handle fields with null or undefined names/types', () => {
      const formData = [
        { name: null, type: 'text' },
        { name: 'email', type: undefined }
      ];

      const result = validateFormData(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Field at index 0 must have a valid name');
      expect(result.errors).toContain('Field at index 1 must have a valid type');
    });
  });
});
