export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  totalPages: number;
  skip: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function calculatePagination(totalCount: number, options: PaginationOptions): PaginationResult {
  const { page, pageSize } = options;
  
  const totalPages = Math.ceil(totalCount / pageSize);
  const skip = (page - 1) * pageSize;
  
  return {
    page,
    pageSize,
    totalPages,
    skip,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

export function validatePaginationParams(page?: string, pageSize?: string): PaginationOptions {
  const validatedPage = Math.max(1, parseInt(page || '1', 10) || 1);
  
  const parsedPageSize = parseInt(pageSize || '10', 10);
  const validatedPageSize = Math.min(100, Math.max(1, isNaN(parsedPageSize) ? 10 : parsedPageSize));
  
  return {
    page: validatedPage,
    pageSize: validatedPageSize
  };
}