// Unit tests for pagination utilities
import { calculatePagination, validatePaginationParams } from '../../../src/utils/pagination';

describe('Pagination Utils', () => {
  describe('calculatePagination', () => {
    it('should calculate pagination correctly for first page', () => {
      const result = calculatePagination(100, { page: 1, pageSize: 10 });

      expect(result).toEqual({
        page: 1,
        pageSize: 10,
        totalPages: 10,
        skip: 0,
        hasNextPage: true,
        hasPreviousPage: false
      });
    });

    it('should calculate pagination correctly for middle page', () => {
      const result = calculatePagination(100, { page: 5, pageSize: 10 });

      expect(result).toEqual({
        page: 5,
        pageSize: 10,
        totalPages: 10,
        skip: 40,
        hasNextPage: true,
        hasPreviousPage: true
      });
    });

    it('should calculate pagination correctly for last page', () => {
      const result = calculatePagination(100, { page: 10, pageSize: 10 });

      expect(result).toEqual({
        page: 10,
        pageSize: 10,
        totalPages: 10,
        skip: 90,
        hasNextPage: false,
        hasPreviousPage: true
      });
    });

    it('should handle partial last page', () => {
      const result = calculatePagination(95, { page: 10, pageSize: 10 });

      expect(result).toEqual({
        page: 10,
        pageSize: 10,
        totalPages: 10,
        skip: 90,
        hasNextPage: false,
        hasPreviousPage: true
      });
    });

    it('should handle empty result set', () => {
      const result = calculatePagination(0, { page: 1, pageSize: 10 });

      expect(result).toEqual({
        page: 1,
        pageSize: 10,
        totalPages: 0,
        skip: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    });

    it('should handle single page result', () => {
      const result = calculatePagination(5, { page: 1, pageSize: 10 });

      expect(result).toEqual({
        page: 1,
        pageSize: 10,
        totalPages: 1,
        skip: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    });

    it('should handle large page sizes', () => {
      const result = calculatePagination(50, { page: 1, pageSize: 100 });

      expect(result).toEqual({
        page: 1,
        pageSize: 100,
        totalPages: 1,
        skip: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    });
  });

  describe('validatePaginationParams', () => {
    it('should use default values when no parameters provided', () => {
      const result = validatePaginationParams();

      expect(result).toEqual({
        page: 1,
        pageSize: 10
      });
    });

    it('should parse valid string parameters', () => {
      const result = validatePaginationParams('3', '20');

      expect(result).toEqual({
        page: 3,
        pageSize: 20
      });
    });

    it('should handle minimum page constraint', () => {
      const result = validatePaginationParams('0', '10');

      expect(result).toEqual({
        page: 1,
        pageSize: 10
      });
    });

    it('should handle maximum page size constraint', () => {
      const result = validatePaginationParams('1', '200');

      expect(result).toEqual({
        page: 1,
        pageSize: 100
      });
    });

    it('should handle minimum page size constraint', () => {
      const result = validatePaginationParams('1', '0');

      expect(result).toEqual({
        page: 1,
        pageSize: 1
      });
    });

    it('should handle invalid string parameters', () => {
      const result = validatePaginationParams('invalid', 'also-invalid');

      expect(result).toEqual({
        page: 1,
        pageSize: 10
      });
    });

    it('should handle negative values', () => {
      const result = validatePaginationParams('-5', '-10');

      expect(result).toEqual({
        page: 1,
        pageSize: 1
      });
    });

    it('should handle decimal values by rounding down', () => {
      const result = validatePaginationParams('2.8', '15.9');

      expect(result).toEqual({
        page: 2,
        pageSize: 15
      });
    });
  });
});
