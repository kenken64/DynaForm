import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { GeneratedForm, FormsResponse, PaginatedFormsResponse } from '../interfaces/form.interface';

@Injectable({
  providedIn: 'root'
})
export class FormsService {
  private readonly apiUrl = '/api';

  // Signal for forms data
  private formsSignal = signal<GeneratedForm[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string>('');
  private formsCountSignal = signal<number>(0);
  
  // Public readonly signals
  readonly forms = this.formsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly formsCount = this.formsCountSignal.asReadonly();
  
  // Computed signals for derived state
  readonly hasFormsComputed = computed(() => this.forms().length > 0);
  readonly recentFormsComputed = computed(() => 
    this.forms()
      .sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime())
      .slice(0, 5)
  );
  
  // Computed signal specifically for side menu (latest 4 records)
  readonly sideMenuFormsComputed = computed(() => 
    this.forms()
      .sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime())
      .slice(0, 4)
  );

  // Subject for triggering form refresh across components
  private formsRefreshSubject = new BehaviorSubject<void>(undefined);
  readonly formsRefresh$ = this.formsRefreshSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load initial forms data
    this.refreshForms();
  }

  /**
   * Refresh forms data and update signals
   */
  refreshForms(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set('');
    
    this.getForms(1, 50).subscribe({
      next: (response) => {
        this.formsSignal.set(response.forms);
        this.formsCountSignal.set(response.totalCount);
        this.loadingSignal.set(false);
        this.formsRefreshSubject.next();
      },
      error: (error) => {
        this.errorSignal.set('Failed to load forms');
        this.loadingSignal.set(false);
        console.error('Error refreshing forms:', error);
      }
    });
  }

  /**
   * Add a new form to the signals
   */
  addFormToCache(form: GeneratedForm): void {
    const currentForms = this.formsSignal();
    this.formsSignal.set([form, ...currentForms]);
    this.formsCountSignal.set(this.formsCountSignal() + 1);
    this.formsRefreshSubject.next();
  }

  /**
   * Remove a form from the signals
   */
  removeFormFromCache(formId: string): void {
    const currentForms = this.formsSignal();
    const updatedForms = currentForms.filter(form => form._id !== formId);
    this.formsSignal.set(updatedForms);
    this.formsCountSignal.set(this.formsCountSignal() - 1);
    this.formsRefreshSubject.next();
  }

  /**
   * Update a form in the signals
   */
  updateFormInCache(updatedForm: GeneratedForm): void {
    const currentForms = this.formsSignal();
    const updatedForms = currentForms.map(form => 
      form._id === updatedForm._id ? updatedForm : form
    );
    this.formsSignal.set(updatedForms);
    this.formsRefreshSubject.next();
  }

  /**
   * Get all forms with optional pagination
   */
  getForms(page?: number, pageSize?: number): Observable<PaginatedFormsResponse> {
    let params = new HttpParams();
    
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/forms`, { params })
      .pipe(
        map(response => {
          // Transform the response to match our pagination interface
          const totalForms = response.count || 0;
          const currentPageSize = pageSize || 10;
          const currentPage = page || 1;
          const totalPages = Math.ceil(totalForms / currentPageSize);
          
          return {
            success: response.success,
            count: response.count || 0,
            totalCount: response.count || 0,
            totalPages,
            currentPage,
            pageSize: currentPageSize,
            forms: response.data || response.forms || [] // Handle both 'data' and 'forms' fields
          };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get a single form by ID
   */
  getForm(id: string): Observable<GeneratedForm> {
    return this.http.get<any>(`${this.apiUrl}/forms/${id}`)
      .pipe(
        map(response => response.form || response.data || response), // Handle different response structures
        catchError(this.handleError)
      );
  }

  /**
   * Delete a form by ID
   */
  deleteForm(id: string): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/forms/${id}`)
      .pipe(
        tap(() => {
          // Automatically remove from cache when deleted successfully
          this.removeFormFromCache(id);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Search forms by title or content
   */
  searchForms(query: string, page?: number, pageSize?: number): Observable<PaginatedFormsResponse> {
    let params = new HttpParams().set('search', query);
    
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/forms/search`, { params })
      .pipe(
        map(response => {
          const totalForms = response.count || 0;
          const currentPageSize = pageSize || 10;
          const currentPage = page || 1;
          const totalPages = Math.ceil(totalForms / currentPageSize);
          
          return {
            success: response.success,
            count: response.count || 0,
            totalCount: response.count || 0,
            totalPages,
            currentPage,
            pageSize: currentPageSize,
            forms: response.data || response.forms || [] // Handle both 'data' and 'forms' fields
          };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update a form (e.g., form title)
   */
  updateForm(id: string, formData: Partial<GeneratedForm>): Observable<GeneratedForm> {
    return this.http.put<any>(`${this.apiUrl}/forms/${id}`, formData)
      .pipe(
        map(response => response.form || response.data || response),
        tap((updatedForm) => {
          // Update form in cache
          this.updateFormInCache(updatedForm);
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('Forms Service Error:', error);
    let errorMessage = 'An unknown error occurred!';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.error?.message || error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
