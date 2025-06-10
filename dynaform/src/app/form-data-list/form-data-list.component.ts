import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormDataService, FormDataEntry, FormDataListResponse } from '../services/form-data.service';
import { PublicFormService } from '../services/public-form.service';
import { AuthService, User } from '../auth/auth.service';
import { MatTabChangeEvent } from '@angular/material/tabs';

@Component({
    selector: 'app-form-data-list',
    templateUrl: './form-data-list.component.html',
    styleUrl: './form-data-list.component.css',
    standalone: false
})
export class FormDataListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Tab functionality
  selectedTab = 0;
  
  // Internal form submissions (existing)
  formSubmissions: FormDataEntry[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  currentPage = 1;
  pageSize = 6;
  totalCount = 0;
  totalPages = 0;
  currentUser: User | null = null;
  isClientSideFiltering = false;

  // Public form submissions
  aggregatedPublicSubmissions: any[] = [];
  userPublicSubmissions: any[] = [];  // Now contains aggregated forms data (one record per form)
  publicLoading = false;
  publicError = '';
  publicSearchTerm = '';
  publicDisplayedColumns: string[] = ['formTitle', 'formCreator', 'submissionCount', 'latestSubmission', 'actions'];
  userPublicDisplayedColumns: string[] = ['formId', 'formTitle', 'formDescription', 'submissionCount', 'actions'];  // Updated columns

  // Expose Math to template
  Math = Math;

  constructor(
    private formDataService: FormDataService,
    private publicFormService: PublicFormService,
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
    
    // Check if we have proper authentication - if not, fall back to general endpoints with client-side filtering
    const hasValidAuth = this.authService.isAuthenticated() && this.authService.getAuthHeaders().get('Authorization') !== 'Bearer null';
    const useUserSpecificEndpoints = hasValidAuth;
    
    console.log('Authentication status:', { hasValidAuth, useUserSpecificEndpoints });
    
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
              this.totalPages = Math.ceil(response.totalCount / this.pageSize);
              this.isClientSideFiltering = false;
            } else {
              // Client-side filtering - filter results to current user
              this.formSubmissions = this.filterUserSubmissions(response.submissions);
              this.updatePaginationCounts(this.formSubmissions.length, response.submissions.length, response.totalCount);
              this.isClientSideFiltering = true;
            }
            
            console.log(`Search completed: ${this.formSubmissions.length} submissions, ${this.totalPages} pages`);
            this.loading = false;
          },
          error: (error) => {
            // If user-specific endpoint fails, try fallback to general endpoint
            if (useUserSpecificEndpoints && (error.status === 401 || error.status === 403)) {
              console.log('User-specific endpoint failed, falling back to general endpoint with client-side filtering');
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
              console.log(response);
              this.formSubmissions = response.submissions;
              this.totalCount = response.totalCount;
              this.totalPages = Math.ceil(response.totalCount / this.pageSize);
              this.isClientSideFiltering = false;
            } else {
              // Client-side filtering - filter results to current user
              this.formSubmissions = this.filterUserSubmissions(response.submissions);
              this.updatePaginationCounts(this.formSubmissions.length, response.submissions.length, response.totalCount);
              this.isClientSideFiltering = true;
            }
            
            console.log(`Data loaded: ${this.formSubmissions.length} submissions, ${this.totalPages} pages`);
            this.loading = false;
          },
          error: (error) => {
            // If user-specific endpoint fails, try fallback to general endpoint
            if (useUserSpecificEndpoints && (error.status === 401 || error.status === 403)) {
              console.log('User-specific endpoint failed, falling back to general endpoint with client-side filtering');
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
    console.log('Using client-side filtering fallback');
    this.isClientSideFiltering = true;
    
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

  // Update pagination counts for client-side filtering
  private updatePaginationCounts(filteredCount: number, originalCount: number, totalCount: number): void {
    // For client-side filtering, we need to estimate pagination based on filtered results
    this.totalCount = filteredCount; // Use filtered count as total for user
    this.totalPages = Math.ceil(filteredCount / this.pageSize);
    
    console.log(`Pagination updated: ${filteredCount} filtered items, ${this.totalPages} pages (original: ${originalCount}/${totalCount})`);
  }

  onSearch() {
    if (this.selectedTab === 0) {
      // Internal tab - use existing search logic
      this.currentPage = 1;
      this.loadFormData();
    } else if (this.selectedTab === 1) {
      // Public tab - use public search logic
      this.onPublicSearch();
    }
  }

  clearSearch() {
    this.searchTerm = '';
    if (this.selectedTab === 0) {
      // Internal tab
      this.currentPage = 1;
      this.loadFormData();
    } else if (this.selectedTab === 1) {
      // Public tab
      this.clearPublicSearch();
    }
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
    
    if (this.totalPages <= 1) {
      return pages;
    }
    
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
    // Show pagination if we have more than one page OR if we have data that could span multiple pages
    return this.totalCount > this.pageSize && !this.isClientSideFiltering;
  }

  // Tab functionality methods
  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTab = event.index;
    
    // Clear search when switching tabs for better UX
    this.searchTerm = '';
    this.publicSearchTerm = '';
    
    if (this.selectedTab === 1) {
      // Load public submissions when switching to Public tab
      this.loadPublicSubmissions();
    }
  }

  // Public submission methods
  loadPublicSubmissions(): void {
    if (!this.currentUser) {
      this.publicError = 'Authentication required to view public submissions';
      return;
    }

    this.publicLoading = true;
    this.publicError = '';
    
    // Load aggregated forms data (one record per form)
    this.publicFormService.getUserPublicFormsAggregated(this.currentUser.id, 1, 100, this.publicSearchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('User aggregated forms response:', response);
          this.userPublicSubmissions = response.forms || [];
          this.publicLoading = false;
        },
        error: (error) => {
          console.error('Error loading user aggregated forms:', error);
          this.publicError = 'Failed to load public submissions. Please try again.';
          this.publicLoading = false;
        }
      });
  }

  onPublicSearch(): void {
    // Copy the global search term to public search term
    this.publicSearchTerm = this.searchTerm;
    // Reload submissions with search filter
    this.loadPublicSubmissions();
  }

  clearPublicSearch(): void {
    this.publicSearchTerm = '';
    this.searchTerm = '';
    this.loadPublicSubmissions();
  }

  exportPublicData(): void {
    this.formDataService.exportPublicSubmissions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `public-form-submissions-${new Date().toISOString().split('T')[0]}.xlsx`;
          link.click();
          URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error exporting public data:', error);
          alert('Failed to export public data. Please try again.');
        }
      });
  }

  exportPublicSubmissionsByForm(formId: string): void {
    this.formDataService.exportPublicSubmissions(formId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `form-${formId}-submissions-${new Date().toISOString().split('T')[0]}.xlsx`;
          link.click();
          URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error exporting form submissions:', error);
          alert('Failed to export form submissions. Please try again.');
        }
      });
  }
}
