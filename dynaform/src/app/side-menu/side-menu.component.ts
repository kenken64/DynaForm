import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { FormsService } from '../services/forms.service';
import { GeneratedForm, PaginatedFormsResponse } from '../interfaces/form.interface';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.css']
})
export class SideMenuComponent implements OnInit, OnDestroy {
  @Input() isCollapsed = false;
  @Output() formSelected = new EventEmitter<GeneratedForm>();
  @Output() toggleSidebar = new EventEmitter<void>();

  // Local state for component-specific data
  forms: GeneratedForm[] = [];
  loading = false;
  error = '';
  searchQuery = '';
  
  // Pagination - reduced for side menu (latest 4 only)
  currentPage = 1;
  pageSize = 4; // Reduced to 4 for side menu
  totalPages = 0;
  totalCount = 0;
  
  // Search functionality
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private formsService: FormsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadForms();
    
    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery = query;
      this.currentPage = 1;
      this.performSearch();
    });

    // Subscribe to forms refresh events from service
    this.formsService.formsRefresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Auto-refresh forms when service signals change
        if (!this.searchQuery.trim()) {
          this.syncWithService();
        }
      });

    // Initial sync with service
    this.syncWithService();
  }

  /**
   * Sync local forms with FormsService signals
   */
  private syncWithService(): void {
    // Use the dedicated sideMenuFormsComputed signal for latest 4 records
    const sideMenuForms = this.formsService.sideMenuFormsComputed();
    const serviceLoading = this.formsService.loading();
    const serviceError = this.formsService.error();

    if (!this.searchQuery.trim()) {
      // Only sync if not searching - use side menu specific forms (latest 4)
      this.forms = sideMenuForms;
      this.totalCount = sideMenuForms.length;
      this.totalPages = 1; // Side menu doesn't need pagination for 4 items
    }
    
    // Always sync loading and error states
    this.loading = serviceLoading;
    this.error = serviceError;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadForms(): void {
    // For side menu, prefer using signals for latest 4 records
    if (!this.searchQuery.trim()) {
      this.syncWithService();
      return;
    }

    // Only use API call for search functionality
    this.loading = true;
    this.error = '';
    
    this.formsService.getForms(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedFormsResponse) => {
          this.forms = response.forms || [];
          this.totalPages = response.totalPages || 0;
          this.totalCount = response.count || 0;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load forms. Please try again.';
          this.forms = []; // Ensure forms is always an array
          this.totalPages = 0;
          this.totalCount = 0;
          this.loading = false;
          console.error('Error loading forms:', error);
        }
      });
  }

  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  private performSearch(): void {
    if (!this.searchQuery.trim()) {
      this.loadForms();
      return;
    }

    this.loading = true;
    this.error = '';
    
    this.formsService.searchForms(this.searchQuery, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedFormsResponse) => {
          this.forms = response.forms || [];
          this.totalPages = response.totalPages || 0;
          this.totalCount = response.count || 0;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Search failed. Please try again.';
          this.forms = []; // Ensure forms is always an array
          this.totalPages = 0;
          this.totalCount = 0;
          this.loading = false;
          console.error('Error searching forms:', error);
        }
      });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
  }

  onFormClick(form: GeneratedForm): void {
    this.formSelected.emit(form);
  }

  onDeleteForm(form: GeneratedForm, event: Event): void {
    event.stopPropagation(); // Prevent form selection
    
    if (confirm(`Are you sure you want to delete "${form.metadata.formName}"?`)) {
      this.formsService.deleteForm(form._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // No need to manually reload - service signals will handle the update
            console.log('Form deleted successfully');
          },
          error: (error) => {
            this.error = 'Failed to delete form. Please try again.';
            console.error('Error deleting form:', error);
          }
        });
    }
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      if (this.searchQuery.trim()) {
        this.performSearch();
      } else {
        this.loadForms();
      }
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  getFormFieldsCount(form: GeneratedForm): number {
    return form.formData ? form.formData.length : 0;
  }

  trackByFormId(index: number, form: GeneratedForm): string {
    return form._id;
  }

  // Navigation methods
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}
