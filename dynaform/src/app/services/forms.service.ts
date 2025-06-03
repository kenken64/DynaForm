import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { GeneratedForm, FormsResponse, PaginatedFormsResponse } from '../interfaces/form.interface';
import { AuthService } from '../auth/auth.service';

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

  constructor(private http: HttpClient, private authService: AuthService) {
    console.log('FormsService: Constructor called');
    console.log('FormsService: Auth state at init:', this.authService.isAuthenticated());
    console.log('FormsService: Current user at init:', this.authService.getCurrentUser());
    
    // Delay the initial load to allow authentication to initialize
    setTimeout(() => {
      console.log('FormsService: Delayed init - Auth state:', this.authService.isAuthenticated());
      console.log('FormsService: Delayed init - Current user:', this.authService.getCurrentUser());
      
      // Only load forms if authenticated
      if (this.authService.isAuthenticated()) {
        console.log('FormsService: User is authenticated, loading forms');
        this.refreshForms();
      } else {
        console.log('FormsService: User not authenticated, skipping initial load');
        // Subscribe to authentication changes
        this.authService.isAuthenticated$.subscribe(isAuth => {
          console.log('FormsService: Auth state changed:', isAuth);
          if (isAuth) {
            console.log('FormsService: Now authenticated, loading forms');
            this.refreshForms();
          }
        });
      }
    }, 100);
  }

  /**
   * Refresh forms data and update signals
   */
  refreshForms(): void {
    console.log('FormsService: refreshForms called');
    console.log('FormsService: Auth state during refresh:', this.authService.isAuthenticated());
    
    this.loadingSignal.set(true);
    this.errorSignal.set('');
    
    this.getForms(1, 50).subscribe({
      next: (response) => {
        console.log('FormsService: getForms success, received forms:', response.forms?.length || 0);
        this.formsSignal.set(response.forms);
        this.formsCountSignal.set(response.totalCount);
        this.loadingSignal.set(false);
        this.formsRefreshSubject.next();
      },
      error: (error) => {
        console.error('FormsService: getForms error:', error);
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
    console.log('FormsService: getForms called with page:', page, 'pageSize:', pageSize);
    
    let params = new HttpParams();
    
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize.toString());
    }

    const headers = this.getAuthHeaders();
    console.log('FormsService: Auth headers:', {
      'Authorization': headers.get('Authorization') ? 'Bearer [TOKEN]' : 'Missing',
      'Content-Type': headers.get('Content-Type')
    });

    return this.http.get<any>(`${this.apiUrl}/forms`, { 
      params,
      headers: headers
    })
      .pipe(
        map(response => {
          console.log('FormsService: Raw API response:', response);
          // Transform the response to match our pagination interface
          const totalForms = response.count || 0;
          const currentPageSize = pageSize || 10;
          const currentPage = page || 1;
          const totalPages = Math.ceil(totalForms / currentPageSize);
          
          const transformedResponse = {
            success: response.success,
            count: response.count || 0,
            totalCount: response.count || 0,
            totalPages,
            currentPage,
            pageSize: currentPageSize,
            forms: response.data || response.forms || [] // Handle both 'data' and 'forms' fields
          };
          
          console.log('FormsService: Transformed response:', transformedResponse);
          return transformedResponse;
        }),
        catchError(error => {
          console.error('FormsService: getForms error:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Get a single form by ID
   */
  getForm(id: string): Observable<GeneratedForm> {
    return this.http.get<any>(`${this.apiUrl}/forms/${id}`, {
      headers: this.getAuthHeaders()
    })
      .pipe(
        map(response => response.form || response.data || response), // Handle different response structures
        catchError(this.handleError)
      );
  }

  /**
   * Delete a form by ID
   */
  deleteForm(id: string): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/forms/${id}`, {
      headers: this.getAuthHeaders()
    })
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

    return this.http.get<any>(`${this.apiUrl}/forms/search`, { 
      params,
      headers: this.getAuthHeaders()
    })
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
   * Save a new form
   */
  saveForm(formData: any): Observable<{ success: boolean; data: { formId: string; savedAt: string } }> {
    return this.http.post<any>(`${this.apiUrl}/forms`, formData, {
      headers: this.getAuthHeaders()
    })
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * Update a form (e.g., form title)
   */
  updateForm(id: string, formData: Partial<GeneratedForm>): Observable<GeneratedForm> {
    return this.http.put<any>(`${this.apiUrl}/forms/${id}`, formData, {
      headers: this.getAuthHeaders()
    })
      .pipe(
        map(response => response.form || response.data || response),
        tap((updatedForm) => {
          // Update form in cache
          this.updateFormInCache(updatedForm);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get authentication headers for API requests
   */
  private getAuthHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
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
