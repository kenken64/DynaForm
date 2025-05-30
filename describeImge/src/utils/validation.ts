import { ObjectId } from 'mongodb';

export const isValidObjectId = (id: string): boolean => {
    return ObjectId.isValid(id);
};

export const createObjectId = (id?: string) => {
    return id ? new ObjectId(id) : new ObjectId();
};

export const toObjectId = (id: string) => {
    if (!isValidObjectId(id)) {
        throw new Error(`Invalid ObjectId: ${id}`);
    }
    return new ObjectId(id);
};

export const validateRequiredFields = (data: Record<string, any>, requiredFields: string[]) => {
    const missingFields = requiredFields.filter(field => {
        const value = data[field];
        return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
};

export const sanitizeString = (input: string, maxLength: number = 1000): string => {
    if (typeof input !== 'string') {
        return '';
    }
    return input.trim().substring(0, maxLength);
};

export const createSearchRegex = (searchTerm: string) => {
    // Escape special regex characters
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return { $regex: escapedTerm, $options: 'i' };
};

export const formatTimestamp = (date: Date = new Date()): string => {
    return date.toISOString();
};

export const parseBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
};
