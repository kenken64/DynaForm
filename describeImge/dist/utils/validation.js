"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidObjectId = isValidObjectId;
exports.validateRequiredFields = validateRequiredFields;
exports.sanitizeSearchQuery = sanitizeSearchQuery;
exports.validateFormData = validateFormData;
exports.validateEmail = validateEmail;
const mongodb_1 = require("mongodb");
function isValidObjectId(id) {
    return mongodb_1.ObjectId.isValid(id);
}
function validateRequiredFields(data, requiredFields) {
    const missingFields = [];
    for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
            missingFields.push(field);
        }
    }
    return missingFields;
}
function sanitizeSearchQuery(query) {
    // Remove special regex characters to prevent injection
    return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function validateFormData(formData) {
    const errors = [];
    if (!Array.isArray(formData)) {
        errors.push('Form data must be an array');
        return { isValid: false, errors };
    }
    formData.forEach((field, index) => {
        if (!field.name || typeof field.name !== 'string') {
            errors.push(`Field at index ${index} must have a valid name`);
        }
        if (!field.type || typeof field.type !== 'string') {
            errors.push(`Field at index ${index} must have a valid type`);
        }
    });
    return {
        isValid: errors.length === 0,
        errors
    };
}
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
//# sourceMappingURL=validation.js.map