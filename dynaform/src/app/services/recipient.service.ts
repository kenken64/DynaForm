import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Recipient, RecipientListResponse, RecipientResponse } from '../interfaces/recipient.interface';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RecipientService {
  private readonly baseUrl = '/api';
  private recipientsSubject = new BehaviorSubject<Recipient[]>([]);
  
  // Observable for components to subscribe to
  public recipients$ = this.recipientsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get all recipients with pagination and search
  getRecipients(page: number = 1, pageSize: number = 10, searchTerm?: string): Observable<RecipientListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (searchTerm && searchTerm.trim()) {
      params = params.set('search', searchTerm.trim());
    }

    return this.http.get<RecipientListResponse>(`${this.baseUrl}/recipients`, {
      params,
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.recipientsSubject.next(response.recipients);
        }
      }),
      catchError(error => {
        console.error('Error loading recipients:', error);
        return throwError(() => error);
      })
    );
  }

  // Get recipient by ID
  getRecipientById(id: string): Observable<Recipient> {
    return this.http.get<RecipientResponse>(`${this.baseUrl}/recipients/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success || !response.recipient) {
          throw new Error('Recipient not found');
        }
        return response.recipient;
      }),
      catchError(error => {
        console.error('Error loading recipient:', error);
        return throwError(() => error);
      })
    );
  }

  // Create new recipient
  createRecipient(recipient: Omit<Recipient, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Observable<Recipient> {
    return this.http.post<RecipientResponse>(`${this.baseUrl}/recipients`, recipient, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success || !response.recipient) {
          throw new Error(response.message || 'Failed to create recipient');
        }
        return response.recipient;
      }),
      tap(() => {
        // Refresh the recipients list
        this.refreshRecipients();
      }),
      catchError(error => {
        console.error('Error creating recipient:', error);
        return throwError(() => error);
      })
    );
  }

  // Update recipient
  updateRecipient(id: string, recipient: Partial<Recipient>): Observable<Recipient> {
    return this.http.put<RecipientResponse>(`${this.baseUrl}/recipients/${id}`, recipient, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success || !response.recipient) {
          throw new Error(response.message || 'Failed to update recipient');
        }
        return response.recipient;
      }),
      tap(() => {
        // Refresh the recipients list
        this.refreshRecipients();
      }),
      catchError(error => {
        console.error('Error updating recipient:', error);
        return throwError(() => error);
      })
    );
  }

  // Delete recipient
  deleteRecipient(id: string): Observable<void> {
    return this.http.delete<{success: boolean, message: string}>(`${this.baseUrl}/recipients/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete recipient');
        }
      }),
      tap(() => {
        // Remove from local state and refresh
        const currentRecipients = this.recipientsSubject.value;
        const updatedRecipients = currentRecipients.filter(r => r._id !== id);
        this.recipientsSubject.next(updatedRecipients);
      }),
      catchError(error => {
        console.error('Error deleting recipient:', error);
        return throwError(() => error);
      })
    );
  }

  // Search recipients
  searchRecipients(searchTerm: string, page: number = 1, pageSize: number = 10): Observable<RecipientListResponse> {
    return this.getRecipients(page, pageSize, searchTerm);
  }

  // Refresh recipients list
  private refreshRecipients(): void {
    this.getRecipients(1, 100).subscribe(); // Get first 100 recipients for local state
  }

  // Export recipients to CSV
  exportRecipients(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/recipients/export`, {
      headers: this.authService.getAuthHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting recipients:', error);
        return throwError(() => error);
      })
    );
  }
}
