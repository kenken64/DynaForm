import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormDataService, FormDataEntry, FormDataListResponse } from '../services/form-data.service';

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

  // Expose Math to template
  Math = Math;

  constructor(
    private formDataService: FormDataService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFormData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFormData(): void {
    console.log('Loading form data...');
    this.loading = true;
    this.error = '';
    
    if (this.searchTerm.trim()) {
      this.formDataService.searchFormData(this.searchTerm, this.currentPage, this.pageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: FormDataListResponse) => {
            console.log('Search results:', response);
            this.formSubmissions = response.submissions;
            this.totalCount = response.totalCount;
            this.totalPages = response.totalPages;
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
            this.formSubmissions = response.submissions;
            this.totalCount = response.totalCount;
            this.totalPages = response.totalPages;
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
    this.router.navigate(['/form-data', submission.formId]);
  }

  deleteSubmission(submission: FormDataEntry) {
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
    this.formDataService.exportFormData('csv')
      .pipe(takeUntil(this.destroy$))
      .subscribe(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `form-submissions-${new Date().toISOString().split('T')[0]}.csv`;
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
