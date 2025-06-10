import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormDataService, FormDataEntry } from '../services/form-data.service';

@Component({
    selector: 'app-form-data-viewer',
    templateUrl: './form-data-viewer.component.html',
    styleUrl: './form-data-viewer.component.css',
    standalone: false
})
export class FormDataViewerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  submission: FormDataEntry | null = null;
  loading = false;
  error = '';
  submissionId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formDataService: FormDataService
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.submissionId = params.get('id');
      if (this.submissionId) {
        this.loadSubmission(this.submissionId);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubmission(submissionId: string) {
    this.loading = true;
    this.error = '';
    
    this.formDataService.getFormDataById(submissionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (submission) => {
          this.submission = submission;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load form submission';
          this.loading = false;
          console.error('Error loading submission:', error);
        }
      });
  }

  goBack() {
    this.router.navigate(['/form-data']);
  }

  deleteSubmission() {
    if (!this.submission) return;
    
    if (confirm('Are you sure you want to delete this form submission?')) {
      this.formDataService.deleteFormData(this.submission._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.router.navigate(['/form-data']);
          },
          error: (error) => {
            this.error = 'Failed to delete form submission';
            console.error('Error deleting submission:', error);
          }
        });
    }
  }

  exportSubmission() {
    if (!this.submission) return;
    
    const dataStr = JSON.stringify(this.submission, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form-submission-${this.submission._id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  }

  getFormDataEntries(): Array<{key: string, value: any}> {
    if (!this.submission?.formData) return [];
    
    return Object.entries(this.submission.formData).map(([key, value]) => ({
      key,
      value
    }));
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'Not provided';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  }

  isComplexValue(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }
}
