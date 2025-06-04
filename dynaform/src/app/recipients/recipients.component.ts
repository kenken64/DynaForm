import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { Recipient } from '../interfaces/recipient.interface';
import { RecipientGroup } from '../interfaces/recipient-group.interface';
import { RecipientService } from '../services/recipient.service';
import { RecipientGroupService } from '../services/recipient-group.service';
import { AuthService, User } from '../auth/auth.service';
import { RecipientDialogComponent } from '../recipient-dialog/recipient-dialog.component';
import { RecipientGroupDialogComponent, RecipientGroupDialogData } from '../recipient-group-dialog/recipient-group-dialog.component';

@Component({
  selector: 'app-recipients',
  templateUrl: './recipients.component.html',
  styleUrl: './recipients.component.css'
})
export class RecipientsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  recipients: Recipient[] = [];
  recipientGroups: RecipientGroup[] = [];
  loading = false;
  error = '';
  
  // Current view mode
  viewMode: 'recipients' | 'groups' = 'recipients';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  
  // Search
  searchControl = new FormControl('');
  searchTerm = '';
  
  // Current user
  currentUser: User | null = null;
  
  // Table columns to display
  displayedColumns: string[] = ['name', 'jobTitle', 'email', 'companyName', 'actions'];
  groupDisplayedColumns: string[] = ['aliasName', 'description', 'recipientCount', 'actions'];

  // Expose Math to template
  Math = Math;

  constructor(
    private recipientService: RecipientService,
    private recipientGroupService: RecipientGroupService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Get current user
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.error = 'You must be logged in to manage recipients.';
      this.authService.logout();
      return;
    }

    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.searchTerm = searchTerm || '';
        this.currentPage = 1; // Reset to first page on search
        if (this.viewMode === 'recipients') {
          this.loadRecipients();
        } else {
          this.loadRecipientGroups();
        }
      });

    // Load initial data
    this.loadRecipients();
    this.loadRecipientGroups();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRecipients(): void {
    if (!this.currentUser) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.recipientService.getRecipients(this.currentPage, this.pageSize, this.searchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recipients = response.recipients;
          this.totalCount = response.totalCount;
          this.totalPages = response.totalPages;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load recipients. Please try again.';
          this.loading = false;
          console.error('Error loading recipients:', error);
          this.showSnackBar('Failed to load recipients', 'error');
        }
      });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(RecipientDialogComponent, {
      width: '500px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createRecipient(result);
      }
    });
  }

  openEditDialog(recipient: Recipient): void {
    const dialogRef = this.dialog.open(RecipientDialogComponent, {
      width: '500px',
      data: { mode: 'edit', recipient: { ...recipient } }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && recipient._id) {
        this.updateRecipient(recipient._id, result);
      }
    });
  }

  createRecipient(recipientData: Omit<Recipient, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>): void {
    this.recipientService.createRecipient(recipientData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackBar('Recipient created successfully', 'success');
          this.loadRecipients();
        },
        error: (error) => {
          console.error('Error creating recipient:', error);
          this.showSnackBar('Failed to create recipient', 'error');
        }
      });
  }

  updateRecipient(id: string, recipientData: Partial<Recipient>): void {
    this.recipientService.updateRecipient(id, recipientData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackBar('Recipient updated successfully', 'success');
          this.loadRecipients();
        },
        error: (error) => {
          console.error('Error updating recipient:', error);
          this.showSnackBar('Failed to update recipient', 'error');
        }
      });
  }

  deleteRecipient(recipient: Recipient): void {
    if (!recipient._id) {
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete ${recipient.name}?`);
    if (!confirmed) {
      return;
    }

    this.recipientService.deleteRecipient(recipient._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackBar('Recipient deleted successfully', 'success');
          this.loadRecipients();
        },
        error: (error) => {
          console.error('Error deleting recipient:', error);
          this.showSnackBar('Failed to delete recipient', 'error');
        }
      });
  }

  exportRecipients(): void {
    this.recipientService.exportRecipients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `recipients-${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          URL.revokeObjectURL(url);
          this.showSnackBar('Recipients exported successfully', 'success');
        },
        error: (error) => {
          console.error('Error exporting recipients:', error);
          this.showSnackBar('Failed to export recipients', 'error');
        }
      });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRecipients();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  shouldShowPagination(): boolean {
    return this.totalCount > this.pageSize;
  }

  // Load recipient groups
  loadRecipientGroups(): void {
    this.loading = true;
    this.error = '';

    this.recipientGroupService.getRecipientGroups(this.currentPage, this.pageSize, this.searchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recipientGroups = response.groups || [];
          this.totalCount = response.totalCount || 0;
          this.totalPages = response.totalPages || 0;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading recipient groups:', error);
          this.error = 'Failed to load recipient groups. Please try again.';
          this.loading = false;
        }
      });
  }

  // Open create group dialog
  openCreateGroupDialog(): void {
    const dialogData: RecipientGroupDialogData = {
      isEdit: false
    };

    const dialogRef = this.dialog.open(RecipientGroupDialogComponent, {
      width: '600px',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result: Partial<RecipientGroup>) => {
      if (result) {
        this.createRecipientGroup(result);
      }
    });
  }

  // Open edit group dialog
  openEditGroupDialog(group: RecipientGroup): void {
    if (!group._id) {
      this.showSnackBar('Invalid group selected', 'error');
      return;
    }

    // Fetch the complete group details including recipient information
    this.recipientGroupService.getRecipientGroup(group._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.group) {
            const dialogData: RecipientGroupDialogData = {
              group: response.group,
              isEdit: true
            };

            const dialogRef = this.dialog.open(RecipientGroupDialogComponent, {
              width: '600px',
              data: dialogData,
              disableClose: false
            });

            dialogRef.afterClosed().subscribe((result: Partial<RecipientGroup>) => {
              if (result && group._id) {
                this.updateRecipientGroup(group._id, result);
              }
            });
          } else {
            this.showSnackBar('Failed to load group details', 'error');
          }
        },
        error: (error) => {
          console.error('Error loading group details:', error);
          this.showSnackBar('Failed to load group details', 'error');
        }
      });
  }

  // Create recipient group
  createRecipientGroup(groupData: Partial<RecipientGroup>): void {
    if (!groupData.aliasName || !groupData.recipientIds || groupData.recipientIds.length === 0) {
      this.showSnackBar('Please provide valid group data', 'error');
      return;
    }

    const createData = {
      aliasName: groupData.aliasName,
      description: groupData.description || '',
      recipientIds: groupData.recipientIds
    };

    this.recipientGroupService.createRecipientGroup(createData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSnackBar('Recipient group created successfully', 'success');
            this.loadRecipientGroups();
          } else {
            this.showSnackBar(response.message || 'Failed to create group', 'error');
          }
        },
        error: (error) => {
          console.error('Error creating recipient group:', error);
          this.showSnackBar('Failed to create recipient group', 'error');
        }
      });
  }

  // Update recipient group
  updateRecipientGroup(groupId: string, groupData: Partial<RecipientGroup>): void {
    // Ensure we have the recipientIds array properly set
    const updateData = {
      aliasName: groupData.aliasName,
      description: groupData.description || '',
      recipientIds: groupData.recipientIds || []
    };

    this.recipientGroupService.updateRecipientGroup(groupId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSnackBar('Recipient group updated successfully', 'success');
            this.loadRecipientGroups();
          } else {
            this.showSnackBar(response.message || 'Failed to update group', 'error');
          }
        },
        error: (error) => {
          console.error('Error updating recipient group:', error);
          this.showSnackBar('Failed to update recipient group', 'error');
        }
      });
  }

  // Delete recipient group
  deleteRecipientGroup(group: RecipientGroup): void {
    if (!group._id) return;

    const confirmMessage = `Are you sure you want to delete the group "${group.aliasName}"? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      this.recipientGroupService.deleteRecipientGroup(group._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showSnackBar('Recipient group deleted successfully', 'success');
              this.loadRecipientGroups();
            } else {
              this.showSnackBar(response.message || 'Failed to delete group', 'error');
            }
          },
          error: (error) => {
            console.error('Error deleting recipient group:', error);
            this.showSnackBar('Failed to delete recipient group', 'error');
          }
        });
    }
  }

  // Get recipient count for a group
  getRecipientCount(group: RecipientGroup): number {
    return group.recipientIds?.length || 0;
  }

  // Export groups
  exportGroups(): void {
    this.showSnackBar('Group export functionality coming soon', 'success');
  }

  // View mode switching
  onViewModeChange(event: any): void {
    this.viewMode = event.value;
    this.searchTerm = '';
    this.currentPage = 1;
    
    if (this.viewMode === 'recipients') {
      this.loadRecipients();
    } else {
      this.loadRecipientGroups();
    }
  }

  switchToRecipientsView(): void {
    this.viewMode = 'recipients';
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadRecipients();
  }

  switchToGroupsView(): void {
    this.viewMode = 'groups';
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadRecipientGroups();
  }

  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }
}
