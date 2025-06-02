// Common interfaces for the application
export interface OllamaError extends Error {
  ollamaError?: string;
  status?: number;
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// Form Data Interfaces
export interface FieldConfiguration {
  mandatory: boolean;
  validation: boolean;
}

export interface FormField {
  name: string;
  type: string;
  value?: any;
  options?: string[];
  configuration?: FieldConfiguration;
}

export interface SaveFormRequest {
  formData: FormField[];
  fieldConfigurations: Record<string, FieldConfiguration>;
  originalJson?: any;
  metadata?: {
    createdAt?: string;
    formName?: string;
    version?: string;
  };
}

export interface GeneratedForm {
  _id?: any;
  formData: FormField[];
  fieldConfigurations: Record<string, FieldConfiguration>;
  originalJson?: any;
  metadata: {
    createdAt: string;
    formName?: string;
    version: string;
    updatedAt?: string;
    createdBy: string; // User ID of the form creator
  };
}

// API Response interfaces
export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  data: T[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Form Data Submission interfaces
export interface FormDataSubmission {
  formId: string;
  formTitle?: string;
  formData: Record<string, any>;
  userInfo?: {
    userId?: string;
    email?: string;
    name?: string;
  };
  submissionMetadata?: Record<string, any>;
}

export interface SavedFormDataSubmission extends FormDataSubmission {
  _id?: any;
  submissionMetadata: {
    submittedAt: string;
    ipAddress: string;
    userAgent: string;
    [key: string]: any;
  };
  updatedAt: string;
}

// Recipient Interfaces
export interface Recipient {
  _id?: any;
  name: string;
  jobTitle: string;
  email: string;
  companyName: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CreateRecipientRequest {
  name: string;
  jobTitle: string;
  email: string;
  companyName: string;
}

export interface UpdateRecipientRequest {
  name?: string;
  jobTitle?: string;
  email?: string;
  companyName?: string;
}