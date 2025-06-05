import { ObjectId } from 'mongodb';

export function isValidObjectId(id: string): boolean {
  if (typeof id !== 'string') {
    return false;
  }
  return ObjectId.isValid(id);
}

export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): string[] {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field);
    }
  }
  
  return missingFields;
}

export function sanitizeSearchQuery(query: string): string {
  // Remove special regex characters to prevent injection
  return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validateFormData(formData: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
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

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}