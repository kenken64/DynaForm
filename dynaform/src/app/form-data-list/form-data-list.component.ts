import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormDataService, FormDataEntry, FormDataListResponse } from '../services/form-data.service';
import { AuthService, User } from '../auth/auth.service';

@Component({
  selector: 'app-form-data-list',
  templateUrl: './form-data-list.component.html',
  styleUrl: './form-data-list.component.css'
})
export class FormDataListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  formSubmissions: FormDataEntry[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  currentPage = 1;
  pageSize = 6;
  totalCount = 0;
  totalPages = 0;
  currentUser: User | null = null;
  isClientSideFiltering = false; // Track when we're doing client-side filtering

  // Expose Math to template
  Math = Math;

  constructor(
    private formDataService: FormDataService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get current authenticated user
    this.currentUser = this.authService.getCurrentUser();
    
    // TEMPORARY: Create mock user for testing since auth is disabled
    if (!this.currentUser) {
      console.warn('No authenticated user found, using mock user for testing');
      this.currentUser = {
        id: 'kenneth',
        username: 'kenneth',
        email: 'kenneth@example.com',
        name: 'Kenneth Test User',
        role: 'user',
        isActive: true,
        isEmailVerified: true
      };
    }
    
    console.log('Using current user for filtering:', this.currentUser);
    this.loadFormData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFormData(): void {
    // Ensure user is still authenticated
    if (!this.currentUser) {
      this.error = 'Session expired. Please log in again.';
      this.authService.logout();
      return;
    }

    console.log('Loading form data for user:', this.currentUser.username);
    this.loading = true;
    this.error = '';
    
    // Try to use user-specific endpoints first for better performance
    const useUserSpecificEndpoints = true; // Can be toggled based on backend support
    
    if (this.searchTerm.trim()) {
      const searchObservable = useUserSpecificEndpoints
        ? this.formDataService.searchUserFormData(this.currentUser.id, this.searchTerm, this.currentPage, this.pageSize)
        : this.formDataService.searchFormData(this.searchTerm, this.currentPage, this.pageSize);
      
      searchObservable
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: FormDataListResponse) => {
            console.log('Search results:', response);
            
            if (useUserSpecificEndpoints) {
              // Server-side filtering - use response directly
              this.formSubmissions = response.submissions;
              this.totalCount = response.totalCount;
              this.totalPages = response.totalPages;
              this.isClientSideFiltering = false;
            } else {
              // Client-side filtering fallback
              this.formSubmissions = this.filterUserSubmissions(response.submissions);
              this.updatePaginationCounts(this.formSubmissions.length, response.submissions.length, response.totalCount);
            }
            
            console.log(`Search completed: ${this.formSubmissions.length} submissions, ${this.totalPages} pages`);
            this.loading = false;
          },
          error: (error) => {
            // If user-specific endpoint fails, fallback to general search with client filtering
            if (useUserSpecificEndpoints && error.status === 404) {
              console.log('User-specific search endpoint not available, falling back to client-side filtering');
              this.loadFormDataWithClientFiltering();
            } else {
              this.error = 'Failed to search form data. Please try again.';
              this.loading = false;
              console.error('Error searching form data:', error);
            }
          }
        });
    } else {
      const getAllObservable = useUserSpecificEndpoints
        ? this.formDataService.getUserFormData(this.currentUser.id, this.currentPage, this.pageSize)
        : this.formDataService.getAllFormData(this.currentPage, this.pageSize);
      
      getAllObservable
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: FormDataListResponse) => {
            console.log('All form data response:', response);
            
            if (useUserSpecificEndpoints) {
              // Server-side filtering - use response directly
              this.formSubmissions = response.submissions;
              this.totalCount = response.totalCount;
              this.totalPages = response.totalPages;
              this.isClientSideFiltering = false;
            } else {
              // Client-side filtering fallback
              this.formSubmissions = this.filterUserSubmissions(response.submissions);
              this.updatePaginationCounts(this.formSubmissions.length, response.submissions.length, response.totalCount);
            }
            
            console.log(`Data loaded: ${this.formSubmissions.length} submissions, ${this.totalPages} pages`);
            this.loading = false;
          },
          error: (error) => {
            // If user-specific endpoint fails, fallback to general API with client filtering
            if (useUserSpecificEndpoints && error.status === 404) {
              console.log('User-specific endpoint not available, falling back to client-side filtering');
              this.loadFormDataWithClientFiltering();
            } else {
              this.error = 'Failed to load form data. Please try again.';
              this.loading = false;
              console.error('Error loading form data:', error);
            }
          }
        });
    }
  }

  // Fallback method for client-side filtering when server-side filtering is not available
  private loadFormDataWithClientFiltering(): void {
    if (this.searchTerm.trim()) {
      this.formDataService.searchFormData(this.searchTerm, this.currentPage, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: FormDataListResponse) => {
            console.log('Fallback search results:', response);
            this.formSubmissions = this.filterUserSubmissions(response.submissions);
            this.updatePaginationCounts(this.formSubmissions.length, response.submissions.length, response.totalCount);
            this.loading = false;
          },
          error: (error) => {
            this.error = 'Failed to search form data. Please try again.';
            this.loading = false;
            console.error('Error in fallback search:', error);
          }
        });
    } else {
      this.formDataService.getAllFormData(this.currentPage, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: FormDataListResponse) => {
            console.log('Fallback all data response:', response);
            this.formSubmissions = this.filterUserSubmissions(response.submissions);
            this.updatePaginationCounts(this.formSubmissions.length, response.submissions.length, response.totalCount);
            this.loading = false;
          },
          error: (error) => {
            this.error = 'Failed to load form data. Please try again.';
            this.loading = false;
            console.error('Error in fallback load:', error);
          }
        });
    }
  }

  // Filter submissions to ensure they belong to the current user
  private filterUserSubmissions(submissions: FormDataEntry[]): FormDataEntry[] {
    if (!this.currentUser) {
      console.warn('No current user found for filtering');
      return [];
    }
    
    console.log('Filtering submissions for user:', {
      id: this.currentUser.id,
      username: this.currentUser.username,
      email: this.currentUser.email
    });
    
    const filteredSubmissions = submissions.filter(submission => {
      const matches = submission.userInfo.userId === this.currentUser!.id ||
                     submission.userInfo.userId === this.currentUser!.username ||
                     submission.userInfo.submittedBy === this.currentUser!.username ||
                     submission.userInfo.submittedBy === this.currentUser!.email;
      
      if (matches) {
        console.log('✓ User submission found:', {
          submissionId: submission._id,
          userInfo: submission.userInfo,
          currentUser: this.currentUser!.username
        });
      }
      
      return matches;
    });
    
    console.log(`Filtered ${filteredSubmissions.length} submissions from ${submissions.length} total`);
    return filteredSubmissions;
  }

  // Check if the current user can access a specific submission
  private canUserAccessSubmission(submission: FormDataEntry): boolean {
    if (!this.currentUser) {
      return false;
    }
    
    return submission.userInfo.userId === this.currentUser.id ||
           submission.userInfo.submittedBy === this.currentUser.username ||
           submission.userInfo.submittedBy === this.currentUser.email;
  }

  onSearch() {
    this.currentPage = 1;
    this.loadFormData();
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadFormData();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadFormData();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadFormData();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadFormData();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  viewSubmission(submission: FormDataEntry) {
    // Security check: ensure user can only view their own submissions
    if (!this.canUserAccessSubmission(submission)) {
      alert('You can only view your own form submissions.');
      return;
    }
    
    this.router.navigate(['/form-data', submission.formId]);
  }

  deleteSubmission(submission: FormDataEntry) {
    // Security check: ensure user can only delete their own submissions
    if (!this.canUserAccessSubmission(submission)) {
      alert('You can only delete your own form submissions.');
      return;
    }
    
    if (confirm(`Are you sure you want to delete this form submission from "${submission.formTitle}"?`)) {
      this.formDataService.deleteFormData(submission._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadFormData(); // Refresh the list
          },
          error: (error) => {
            console.error('Error deleting submission:', error);
            alert('Failed to delete submission. Please try again.');
          }
        });
    }
  }

  exportData() {
    // Only export current user's data
    if (!this.currentUser) {
      alert('You must be logged in to export data.');
      return;
    }
    
    this.formDataService.exportFormData('csv')
      .pipe(takeUntil(this.destroy$))
      .subscribe(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `my-form-submissions-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      });
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  }

  exportSubmission(submission: FormDataEntry) {
    // Security check: ensure user can only export their own submissions
    if (!this.canUserAccessSubmission(submission)) {
      alert('You can only export your own form submissions.');
      return;
    }
    
    const dataStr = JSON.stringify(submission, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form-submission-${submission._id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  trackBySubmissionId(index: number, submission: FormDataEntry): string {
    return submission._id;
  }

  // Check if pagination should be shown
  shouldShowPagination(): boolean {
    // Only show pagination if we have more than one page of actual data
    // and we're not doing client-side filtering that would break pagination
    return this.totalPages > 1 && this.totalCount > this.pageSize;
  }

  // Update pagination counts with proper logic for client-side filtering
  private updatePaginationCounts(filteredCount: number, originalCount: number, serverTotalCount: number): void {
    // When doing client-side filtering, we can't rely on server pagination
    // We need to show all filtered results on a single page to avoid confusion
    
    if (filteredCount !== originalCount && originalCount > 0) {
      // Client-side filtering is happening - disable pagination for accuracy
      console.log(`Client-side filtering detected: ${filteredCount}/${originalCount} submissions match current user`);
      
      this.isClientSideFiltering = true;
      
      // Set pagination to show all filtered results
      this.totalCount = filteredCount;
      this.totalPages = 1;
      this.currentPage = 1;
      
    } else if (filteredCount === originalCount) {
      // No filtering needed or all results belong to user - use server pagination
      this.isClientSideFiltering = false;
      this.totalCount = serverTotalCount;
      this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
      
    } else {
      // Edge case: no results found
      this.isClientSideFiltering = false;
      this.totalCount = 0;
      this.totalPages = 1;
      this.currentPage = 1;
    }
    
    console.log(`Pagination updated: totalCount=${this.totalCount}, totalPages=${this.totalPages}, currentPage=${this.currentPage}, clientFiltering=${this.isClientSideFiltering}`);
  }
}
