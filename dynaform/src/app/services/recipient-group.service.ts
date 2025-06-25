import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecipientGroup, RecipientGroupListResponse, RecipientGroupResponse } from '../interfaces/recipient-group.interface';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RecipientGroupService {
  private apiUrl = '/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get all recipient groups with pagination and search
  getRecipientGroups(page: number = 1, pageSize: number = 10, search: string = ''): Observable<RecipientGroupListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<RecipientGroupListResponse>(`${this.apiUrl}/recipient-groups`, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }

  // Get a specific recipient group by ID
  getRecipientGroup(id: string): Observable<RecipientGroupResponse> {
    return this.http.get<RecipientGroupResponse>(`${this.apiUrl}/recipient-groups/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Create a new recipient group
  createRecipientGroup(group: Omit<RecipientGroup, '_id' | 'createdAt' | 'updatedAt'>): Observable<RecipientGroupResponse> {
    return this.http.post<RecipientGroupResponse>(`${this.apiUrl}/recipient-groups`, group, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Update an existing recipient group
  updateRecipientGroup(id: string, group: Partial<RecipientGroup>): Observable<RecipientGroupResponse> {
    return this.http.put<RecipientGroupResponse>(`${this.apiUrl}/recipient-groups/${id}`, group, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Delete a recipient group
  deleteRecipientGroup(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/recipient-groups/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Add recipients to a group
  addRecipientsToGroup(groupId: string, recipientIds: string[]): Observable<RecipientGroupResponse> {
    return this.http.post<RecipientGroupResponse>(`${this.apiUrl}/recipient-groups/${groupId}/recipients`, { recipientIds }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  // Remove recipients from a group
  removeRecipientsFromGroup(groupId: string, recipientIds: string[]): Observable<RecipientGroupResponse> {
    return this.http.delete<RecipientGroupResponse>(`${this.apiUrl}/recipient-groups/${groupId}/recipients`, { 
      body: { recipientIds },
      headers: this.authService.getAuthHeaders()
    });
  }

  // Search groups by alias name
  searchGroupsByAlias(aliasName: string): Observable<RecipientGroupListResponse> {
    const params = new HttpParams().set('search', aliasName);
    return this.http.get<RecipientGroupListResponse>(`${this.apiUrl}/recipient-groups/search`, { 
      params,
      headers: this.authService.getAuthHeaders()
    });
  }
}
