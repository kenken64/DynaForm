import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap, startWith, switchMap, delay } from 'rxjs/operators';
import { 
  FormDataSubmission, 
  FormDataResponse, 
  FormDataRetrievalResponse 
} from '../interfaces/form.interface';
import { AuthService } from '../auth/auth.service';

export interface FormDataEntry {
  _id: string;
  formId: string;
  formTitle: string | null;
  formData: Record<string, any>;
  userInfo: {
    userId: string;
    username?: string;
    submittedBy: string;
  };
  submissionMetadata: {
    submittedAt: string;
    formVersion?: string;
    totalFields: number;
    filledFields: number;
  };
  updatedAt: string;
}

export interface FormDataListResponse {
  success: boolean;
  submissions: FormDataEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class FormDataService {
  private readonly baseUrl = '/api';

  // Signals for reactive state management
  private allFormDataSignal = signal<FormDataEntry[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string>('');
  
  // Public readonly signals
  readonly allFormData = this.allFormDataSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  
  // Computed signals
  readonly hasData = computed(() => this.allFormData().length > 0);
  readonly totalCount = computed(() => this.allFormData().length);

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Get all form data submissions with pagination (using real backend API)
  getAllFormData(page: number = 1, pageSize: number = 10): Observable<FormDataListResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set('');
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    console.log(this.baseUrl);
    return this.http.get<any>(`${this.baseUrl}/forms-data`, { 
      params,
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('Get all form data response:', response);
        return {
          success: response.success,
          submissions: response.data || [],
          totalCount: response.count || 0,
          page: response.page || page,
          pageSize: response.pageSize || pageSize,
          totalPages: response.totalPages || Math.ceil((response.count || 0) / pageSize)
        };
      }),
      tap(response => {
        this.allFormDataSignal.set(response.submissions);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set('Failed to load form data');
        console.error('Error loading form data:', error);
        return throwError(() => error);
      })
    );
  }

  // Search form data submissions
  searchFormData(query: string, page: number = 1, pageSize: number = 10): Observable<FormDataListResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set('');
    console.log('Searching form data with query:', query, 'Page:', page, 'PageSize:', pageSize);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('search', query);
    
    return this.http.get<any>(`${this.baseUrl}/forms-data/search`, { 
      params,
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('Search response:', response);
        return {
          success: response.success,
          submissions: response.submissions || response.data || [],
          totalCount: response.count || 0,
          page: response.page || page,
          pageSize: response.pageSize || pageSize,
          totalPages: response.totalPages || Math.ceil((response.count || 0) / pageSize)
        };
      }),
      tap(response => {
        this.allFormDataSignal.set(response.submissions);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set('Failed to search form data');
        console.error('Error searching form data:', error);
        return throwError(() => error);
      })
    );
  }

  // Get specific form data by ID
  getFormDataById(id: string): Observable<FormDataEntry> {
    return this.http.get<any>(`${this.baseUrl}/forms-data/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('Get form data by ID response:', response);
        if (!response.success || !response.formData) {
          throw new Error('Form data not found');
        }
        return response.formData;
      }),
      catchError(error => {
        this.errorSignal.set('Failed to load form data');
        console.error('Error loading form data by ID:', error);
        return throwError(() => error);
      })
    );
  }

  // Delete form data submission
  deleteFormData(id: string): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.baseUrl}/forms-data/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Remove from local state
        const currentData = this.allFormDataSignal();
        const updatedData = currentData.filter(item => item._id !== id);
        this.allFormDataSignal.set(updatedData);
      }),
      catchError(error => {
        console.error('Error deleting form data:', error);
        this.errorSignal.set('Failed to delete form data');
        return throwError(() => error);
      })
    );
  }

  // Export form data (using real data from server)
  exportFormData(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    // Get all data first, then convert to desired format
    return this.getAllFormData(1, 1000).pipe( // Get up to 1000 records for export
      map(response => {
        const data = response.submissions;
        
        if (format === 'csv') {
          const csvContent = this.convertToCSV(data);
          return new Blob([csvContent], { type: 'text/csv' });
        } else {
          // For Excel, we'd typically use a library like xlsx
          const csvContent = this.convertToCSV(data);
          return new Blob([csvContent], { type: 'application/vnd.ms-excel' });
        }
      }),
      catchError(error => {
        console.error('Error exporting form data:', error);
        return throwError(() => error);
      })
    );
  }

  // Convert data to CSV format
  private convertToCSV(data: FormDataEntry[]): string {
    if (data.length === 0) return '';
    
    // Headers
    const headers = [
      'Submission ID',
      'Form Title',
      'Submitted By',
      'Submitted Date',
      'Total Fields',
      'Filled Fields'
    ];
    
    // Rows
    const rows = data.map(item => [
      item._id,
      item.formTitle || 'Untitled Form',
      item.userInfo.submittedBy,
      new Date(item.submissionMetadata.submittedAt).toLocaleDateString(),
      item.submissionMetadata.totalFields.toString(),
      item.submissionMetadata.filledFields.toString()
    ]);
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  // Submit form data
  submitFormData(formData: FormDataSubmission): Observable<FormDataResponse> {
    const url = `${this.baseUrl}/forms-data`;
    const headers = this.authService.getAuthHeaders();

    return this.http.post<FormDataResponse>(url, formData, { headers }).pipe(
      map(response => {
        console.log('Submit form data response:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error submitting form data:', error);
        this.errorSignal.set('Failed to submit form data');
        return throwError(() => error);
      })
    );
  }

  // Get form data submissions for specific user with pagination
  getUserFormData(userId: string, page: number = 1, pageSize: number = 10): Observable<FormDataListResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set('');
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('userId', userId);
    
    return this.http.get<any>(`${this.baseUrl}/forms-data/user`, { 
      params,
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('Get user form data response:', response);
        return {
          success: response.success,
          submissions: response.data || [],
          totalCount: response.count || 0,
          page: response.page || page,
          pageSize: response.pageSize || pageSize,
          totalPages: response.totalPages || Math.ceil((response.count || 0) / pageSize)
        };
      }),
      tap(response => {
        this.allFormDataSignal.set(response.submissions);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set('Failed to load user form data');
        console.error('Error loading user form data:', error);
        return throwError(() => error);
      })
    );
  }

  // Search form data submissions for specific user
  searchUserFormData(userId: string, query: string, page: number = 1, pageSize: number = 10): Observable<FormDataListResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set('');
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('search', query)
      .set('userId', userId);
    
    return this.http.get<any>(`${this.baseUrl}/forms-data/user/search`, { 
      params,
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('Search user form data response:', response);
        return {
          success: response.success,
          submissions: response.submissions || response.data || [],
          totalCount: response.count || 0,
          page: response.page || page,
          pageSize: response.pageSize || pageSize,
          totalPages: response.totalPages || Math.ceil((response.count || 0) / pageSize)
        };
      }),
      tap(response => {
        this.allFormDataSignal.set(response.submissions);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set('Failed to search user form data');
        console.error('Error searching user form data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get public form submissions with pagination and search
   */
  getPublicSubmissions(page: number = 1, pageSize: number = 10, search?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
      
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<any>(`${this.baseUrl}/public/submissions`, { params });
  }

  /**
   * Get aggregated public form submissions by form ID
   */
  getAggregatedPublicSubmissions(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/public/submissions/aggregated`);
  }

  /**
   * Export public form submissions as Excel file
   */
  exportPublicSubmissions(formId?: string): Observable<Blob> {
    let url = `${this.baseUrl}/public/export-submissions`;
    if (formId) {
      url += `?formId=${formId}`;
    }
    
    return this.http.get(url, {
      responseType: 'blob'
    });
  }
}
