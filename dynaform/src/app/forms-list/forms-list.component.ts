import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FormsService } from '../services/forms.service';
import { GeneratedForm, PaginatedFormsResponse } from '../interfaces/form.interface';
import { EditTitleDialogComponent, EditTitleDialogData } from './edit-title-dialog.component';

@Component({
    selector: 'app-forms-list',
    templateUrl: './forms-list.component.html',
    styleUrls: ['./forms-list.component.css'],
    standalone: false
})
export class FormsListComponent implements OnInit {
  forms: GeneratedForm[] = [];
  loading = false;
  error = '';
  searchQuery = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalCount = 0;
  totalPages = 0;

  constructor(
    private formsService: FormsService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadForms();
  }

  loadForms(): void {
    this.loading = true;
    this.error = '';

    const loadFunction = this.searchQuery.trim() 
      ? this.formsService.searchForms(this.searchQuery, this.currentPage, this.pageSize)
      : this.formsService.getForms(this.currentPage, this.pageSize);

    loadFunction.subscribe({
      next: (response: PaginatedFormsResponse) => {
        this.loading = false;
        this.forms = response.forms;
        this.currentPage = response.currentPage;
        this.totalPages = response.totalPages;
        this.totalCount = response.totalCount;
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to load forms. Please try again.';
        console.error('Error loading forms:', error);
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.currentPage = 1;
    this.loadForms();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadForms();
  }

  // Method to clear error state and retry
  clearError(): void {
    this.error = '';
    this.loadForms();
  }

  // Navigation methods
  onFormClick(form: GeneratedForm): void {
    // Navigate to view the form
    this.router.navigate(['/forms', form._id]);
  }

  onFormEdit(form: GeneratedForm): void {
    // Navigate to form editor with the form ID
    this.router.navigate(['/form-editor'], { 
      queryParams: { 
        editForm: form._id 
      } 
    });
  }

  createNewForm(): void {
    // Navigate to form editor for creating a new form
    this.router.navigate(['/form-editor']);
  }

  onDeleteForm(form: GeneratedForm): void {
    if (confirm(`Are you sure you want to delete "${form.metadata.formName || 'Untitled Form'}"?`)) {
      this.formsService.deleteForm(form._id).subscribe({
        next: () => {
          this.loadForms(); // Reload the list
        },
        error: (error) => {
          console.error('Error deleting form:', error);
          alert('Failed to delete form. Please try again.');
        }
      });
    }
  }

  // Dialog-based title editing
  editFormTitle(form: GeneratedForm): void {
    const dialogData: EditTitleDialogData = {
      currentTitle: form.metadata.formName || 'Untitled Form',
      formId: form._id
    };

    const dialogRef = this.dialog.open(EditTitleDialogComponent, {
      width: '400px',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(newTitle => {
      if (newTitle && newTitle !== form.metadata.formName) {
        this.updateFormTitle(form, newTitle);
      }
    });
  }

  private updateFormTitle(form: GeneratedForm, newTitle: string): void {
    const updateData = {
      metadata: {
        ...form.metadata,
        formName: newTitle
      }
    };

    this.formsService.updateForm(form._id, updateData).subscribe({
      next: (updatedForm) => {
        // Update the local form data
        const index = this.forms.findIndex(f => f._id === form._id);
        if (index !== -1) {
          this.forms[index] = updatedForm;
        }
      },
      error: (error) => {
        console.error('Error updating form title:', error);
        alert('Failed to update form title. Please try again.');
      }
    });
  }

  // Pagination methods
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadForms();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadForms();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadForms();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);
    
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + maxPagesToShow - 1);
    
    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getFormFieldsCount(form: GeneratedForm): number {
    return form.formData?.length || 0;
  }

  trackByFormId(index: number, form: GeneratedForm): string {
    return form._id;
  }

  isBlockchainVerified(form: GeneratedForm): boolean {
    return form.status === 'verified' && !!form.blockchainInfo;
  }

  getVerificationTooltip(form: GeneratedForm): string {
    if (this.isBlockchainVerified(form)) {
      const blockchainInfo = form.blockchainInfo!;
      return `Blockchain Verified\nTransaction: ${blockchainInfo.transactionHash || 'N/A'}\nVerified: ${blockchainInfo.verifiedAt ? new Date(blockchainInfo.verifiedAt).toLocaleString() : 'N/A'}`;
    }
    return 'Not verified on blockchain';
  }

  // Development method to demo blockchain verification
  // This can be removed in production
  mockBlockchainVerification(form: GeneratedForm): void {
    if (this.isBlockchainVerified(form)) {
      // Remove verification
      form.status = undefined;
      form.blockchainInfo = undefined;
    } else {
      // Add mock verification
      form.status = 'verified';
      form.blockchainInfo = {
        publicUrl: `http://localhost:4200/public/form/${form._id}/mock123`,
        transactionHash: '0x331cf982723264066e0dfd34af9583a7f63588136ecf26e1802bb18dc740d400',
        blockNumber: 567890,
        gasUsed: 45000,
        verifiedAt: new Date().toISOString(),
        contractResponse: { success: true }
      };
    }
  }
}
