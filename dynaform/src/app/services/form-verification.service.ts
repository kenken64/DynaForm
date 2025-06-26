import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FormVerificationResult {
  success: boolean;
  verified: boolean;
  message: string;
  formId?: string;
  formName?: string;
  error?: string;
  verificationData?: {
    status: string;
    publicUrl?: string;
    transactionHash?: string;
    blockNumber?: number;
    verifiedAt?: string;
    gasUsed?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FormVerificationService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  /**
   * Verify a form's blockchain status by form ID
   */
  verifyFormStatus(formId: string): Observable<FormVerificationResult> {
    return this.http.get<FormVerificationResult>(`${this.apiUrl}/forms/verify/${formId}`);
  }

  /**
   * Extract form ID from various URL formats
   */
  extractFormIdFromUrl(input: string): string | null {
    // Remove whitespace
    input = input.trim();
    
    // Check if input is an HTTP/HTTPS URL
    if (this.isHttpUrl(input)) {
      // For HTTP URLs, use specific patterns to extract form ID
      const urlPatterns = [
        // Standard form URL: https://formbt.com/public/form/{formId}/{fingerprint}
        /^https?:\/\/[^\/]+\/public\/form\/([a-fA-F0-9]{24})\/[a-fA-F0-9]+/,
        // Form viewer URL: https://formbt.com/forms/{formId}
        /^https?:\/\/[^\/]+\/forms\/([a-fA-F0-9]{24})/,
        // URL with query params: ?formId=6845b18ab44242b5eeba4e41
        /^https?:\/\/[^\/]+.*[?&]formId=([a-fA-F0-9]{24})/
      ];

      for (const pattern of urlPatterns) {
        const match = input.match(pattern);
        if (match) {
          return match[1];
        }
      }
      
      // If it's an HTTP URL but doesn't match our patterns, return null
      return null;
    }
    
    // For non-HTTP inputs, try to extract form ID from different patterns
    const patterns = [
      // Just the form ID: 6845b18ab44242b5eeba4e41
      /^([a-fA-F0-9]{24})$/,
      // Partial URL patterns (without protocol)
      /\/public\/form\/([a-fA-F0-9]{24})\/[a-fA-F0-9]+/,
      /\/forms\/([a-fA-F0-9]{24})/,
      /[?&]formId=([a-fA-F0-9]{24})/
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Check if input is a valid HTTP/HTTPS URL
   */
  isHttpUrl(input: string): boolean {
    const httpUrlPattern = /^https?:\/\//i;
    return httpUrlPattern.test(input);
  }

  /**
   * Validate if a string is a valid MongoDB ObjectId (24 hex characters)
   */
  isValidFormId(formId: string): boolean {
    return /^[a-fA-F0-9]{24}$/.test(formId);
  }
}
