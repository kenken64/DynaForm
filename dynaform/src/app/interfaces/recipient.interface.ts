export interface Recipient {
  _id?: string;
  name: string;
  jobTitle: string;
  email: string;
  companyName: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string; // User ID who created this recipient
}

export interface RecipientListResponse {
  success: boolean;
  recipients: Recipient[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RecipientResponse {
  success: boolean;
  recipient?: Recipient;
  message?: string;
}
