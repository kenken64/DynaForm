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
    };
}

export interface FormDataSubmission {
    formId: string;
    formTitle?: string;
    formData: Record<string, any>;
    userInfo?: {
        userId?: string;
        [key: string]: any;
    };
    submissionMetadata: {
        submittedAt: string;
        ipAddress: string;
        userAgent: string;
        [key: string]: any;
    };
    updatedAt: string;
}

export interface PaginationQuery {
    page?: string;
    pageSize?: string;
}

export interface SearchQuery extends PaginationQuery {
    search?: string;
}

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
