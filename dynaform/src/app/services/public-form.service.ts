import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GeneratedForm } from '../interfaces/form.interface';

export interface PublicFormSubmission {
  formId: string;
  jsonFingerprint: string;
  submissionData: any;
  submittedAt: string;
}

export interface PublicFormSubmissionResponse {
  success: boolean;
  message: string;
  data?: {
    submissionId: string;
    submittedAt: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PublicFormService {
  private readonly apiUrl = '/api/public';

  constructor(private http: HttpClient) {}

  /**
   * Get a public form by form ID and JSON fingerprint
   * No authentication required
   */
  getPublicForm(formId: string, jsonFingerprint: string): Observable<GeneratedForm> {
    const params = new HttpParams()
      .set('formId', formId)
      .set('jsonFingerprint', jsonFingerprint);

    return this.http.get<GeneratedForm>(`${this.apiUrl}/forms`, { params });
  }

  /**
   * Save public form submission data
   * No authentication required
   */
  savePublicFormData(submissionData: PublicFormSubmission): Observable<PublicFormSubmissionResponse> {
    return this.http.post<PublicFormSubmissionResponse>(`${this.apiUrl}/forms/submit`, submissionData);
  }

  /**
   * Get form by PDF fingerprint (public access)
   * No authentication required
   */
  getFormByPdfFingerprint(pdfFingerprint: string): Observable<GeneratedForm> {
    return this.http.get<GeneratedForm>(`${this.apiUrl}/forms/fingerprint/${pdfFingerprint}`);
  }
}
