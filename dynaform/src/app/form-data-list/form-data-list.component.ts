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
    
    if (this.searchTerm.trim()) {
      this.formDataService.searchFormData(this.searchTerm, this.currentPage, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: FormDataListResponse) => {
            console.log('Search results:', response);
            // Filter results to ensure they belong to the current user
            this.formSubmissions = this.filterUserSubmissions(response.submissions);
            
            // Adjust pagination counts based on filtered results
            // Since we're filtering client-side, we need to estimate the correct pagination
            const filteredCount = this.formSubmissions.length;
            const originalCount = response.submissions.length;
            const filterRatio = originalCount > 0 ? filteredCount / originalCount : 1;
            
            // Estimate total count based on filter ratio
            this.totalCount = Math.round(response.totalCount * filterRatio);
            this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            
            console.log(`Search filtered ${filteredCount}/${originalCount} submissions. Estimated total: ${this.totalCount}, pages: ${this.totalPages}`);
            this.loading = false;
          },
          error: (error) => {
            this.error = 'Failed to search form data. Please try again.';
            this.loading = false;
            console.error('Error searching form data:', error);
          }
        });
    } else {
      console.log('Fetching all form data for page:', this.currentPage, 'with page size:', this.pageSize);
      this.formDataService.getAllFormData(this.currentPage, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: FormDataListResponse) => {
            console.log('All form data response:', response);
            // Filter results to ensure they belong to the current user
            this.formSubmissions = this.filterUserSubmissions(response.submissions);
            
            // Adjust pagination counts based on filtered results
            // Since we're filtering client-side, we need to estimate the correct pagination
            const filteredCount = this.formSubmissions.length;
            const originalCount = response.submissions.length;
            const filterRatio = originalCount > 0 ? filteredCount / originalCount : 1;
            
            // Estimate total count based on filter ratio
            this.totalCount = Math.round(response.totalCount * filterRatio);
            this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            
            console.log(`Filtered ${filteredCount}/${originalCount} submissions. Estimated total: ${this.totalCount}, pages: ${this.totalPages}`);
            this.loading = false;
          },
          error: (error) => {
            this.error = 'Failed to load form data. Please try again.';
            this.loading = false;
            console.error('Error loading form data:', error);
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
    return this.totalCount > this.pageSize;
  }
}
