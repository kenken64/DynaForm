import { PaginationQuery } from '../types';
import config from '../config';

export const validatePagination = (query: PaginationQuery) => {
    const page = Math.max(1, parseInt(query.page || '1'));
    const pageSize = Math.min(
        Math.max(1, parseInt(query.pageSize || config.DEFAULT_PAGE_SIZE.toString())),
        config.MAX_PAGE_SIZE
    );
    
    return { page, pageSize };
};

export const calculateSkip = (page: number, pageSize: number) => {
    return (page - 1) * pageSize;
};

export const calculateTotalPages = (totalCount: number, pageSize: number) => {
    return Math.ceil(totalCount / pageSize);
};

export const createPaginationResponse = <T>(
    data: T[],
    totalCount: number,
    page: number,
    pageSize: number
) => {
    return {
        data,
        pagination: {
            count: totalCount,
            page,
            pageSize,
            totalPages: calculateTotalPages(totalCount, pageSize),
            hasNext: page * pageSize < totalCount,
            hasPrevious: page > 1
        }
    };
};
