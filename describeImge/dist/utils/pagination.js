"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePagination = calculatePagination;
exports.validatePaginationParams = validatePaginationParams;
function calculatePagination(totalCount, options) {
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
function validatePaginationParams(page, pageSize) {
    const validatedPage = Math.max(1, parseInt(page || '1', 10) || 1);
    const validatedPageSize = Math.min(100, Math.max(1, parseInt(pageSize || '10', 10) || 10));
    return {
        page: validatedPage,
        pageSize: validatedPageSize
    };
}
//# sourceMappingURL=pagination.js.map