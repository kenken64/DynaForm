import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GeneratedForm, FormsResponse, PaginatedFormsResponse } from '../interfaces/form.interface';

@Injectable({
  providedIn: 'root'
})
export class FormsService {
  private readonly apiUrl = '/api';

  constructor(private http: HttpClient) {}

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

    return this.http.get<FormsResponse>(`${this.apiUrl}/forms`, { params })
      .pipe(
        map(response => {
          // Transform the response to match our pagination interface
          const totalForms = response.count;
          const currentPageSize = pageSize || 10;
          const currentPage = page || 1;
          const totalPages = Math.ceil(totalForms / currentPageSize);
          
          return {
            success: response.success,
            count: response.count,
            totalCount: response.count,
            totalPages,
            currentPage,
            pageSize: currentPageSize,
            forms: response.forms
          };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get a single form by ID
   */
  getForm(id: string): Observable<GeneratedForm> {
    return this.http.get<{success: boolean, form: GeneratedForm}>(`${this.apiUrl}/forms/${id}`)
      .pipe(
        map(response => response.form),
        catchError(this.handleError)
      );
  }

  /**
   * Delete a form by ID
   */
  deleteForm(id: string): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/forms/${id}`)
      .pipe(
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

    return this.http.get<FormsResponse>(`${this.apiUrl}/forms/search`, { params })
      .pipe(
        map(response => {
          const totalForms = response.count;
          const currentPageSize = pageSize || 10;
          const currentPage = page || 1;
          const totalPages = Math.ceil(totalForms / currentPageSize);
          
          return {
            success: response.success,
            count: response.count,
            totalCount: response.count,
            totalPages,
            currentPage,
            pageSize: currentPageSize,
            forms: response.forms
          };
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
