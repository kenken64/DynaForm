export interface RecipientGroup {
  _id?: string;
  aliasName: string;
  description?: string;
  recipientIds: string[];
  recipients?: Recipient[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface RecipientGroupListResponse {
  success: boolean;
  groups: RecipientGroup[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RecipientGroupResponse {
  success: boolean;
  group?: RecipientGroup;
  message?: string;
}

// Import Recipient interface
import { Recipient } from './recipient.interface';
