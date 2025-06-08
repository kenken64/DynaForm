export interface FormField {
  name: string;
  type: string;
  value?: any;
  options?: string[];
  configuration?: FieldConfiguration;
}

export interface FieldConfiguration {
  mandatory: boolean;
  validation: boolean;
}

// Support for flexible field configuration formats (backward compatibility)
export type FieldConfigurationValue = FieldConfiguration | string[] | any;

export interface GeneratedForm {
  _id: string;
  formData: FormField[];
  fields?: FormField[]; // Additional property for compatibility
  fieldConfigurations: Record<string, FieldConfigurationValue>;
  originalJson?: any;
  metadata: {
    createdAt: string;
    formName: string;
    version: string;
    updatedAt?: string;
  };
  pdfMetadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creation_date?: string;
    modification_date?: string;
    page_count?: number;
    hashes?: {
      md5: string;
      sha1: string;
      sha256: string;
      short_id: string;
      json_fingerprint: string;
    };
  };
  pdfFingerprint?: string; // Store the short_id for easy identification
  status?: string; // Form status (e.g., 'verified' for blockchain-verified forms)
  blockchainInfo?: {
    publicUrl?: string;
    transactionHash?: string;
    blockNumber?: number;
    gasUsed?: number;
    verifiedAt?: string;
    contractResponse?: any;
  };
}

export interface FormsResponse {
  success: boolean;
  count: number;
  forms: GeneratedForm[];
}

export interface PaginatedFormsResponse {
  success: boolean;
  count: number;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  forms: GeneratedForm[];
}

export interface FormDataSubmission {
  formId: string;
  formTitle: string | null;
  formData: Record<string, FormDataField>;
  userInfo: {
    userId: string;
    username?: string;
    submittedBy: string;
  };
  submissionMetadata: {
    formVersion: string;
    totalFields: number;
    filledFields: number;
    submittedAt?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface FormDataField {
  fieldName: string;
  fieldType: string;
  value: any;
  sanitizedKey: string;
}

export interface FormDataResponse {
  success: boolean;
  message: string;
  formId: string;
  isNewSubmission: boolean;
  submittedAt: string;
}

export interface FormDataRetrievalResponse {
  success: boolean;
  formData: {
    _id?: string;
    formId: string;
    formTitle: string | null;
    formData: Record<string, FormDataField>;
    userInfo: any;
    submissionMetadata: any;
    updatedAt: string;
  };
}
