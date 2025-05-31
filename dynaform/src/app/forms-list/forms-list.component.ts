import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FormsService } from '../services/forms.service';
import { GeneratedForm, PaginatedFormsResponse } from '../interfaces/form.interface';
import { EditTitleDialogComponent, EditTitleDialogData } from './edit-title-dialog.component';

@Component({
  selector: 'app-forms-list',
  templateUrl: './forms-list.component.html',
  styleUrls: ['./forms-list.component.css']
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

  onFormClick(form: GeneratedForm): void {
    this.router.navigate(['/forms', form._id]);
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
}
