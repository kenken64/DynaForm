import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { RecipientGroup } from '../interfaces/recipient-group.interface';
import { Recipient } from '../interfaces/recipient.interface';
import { RecipientGroupService } from '../services/recipient-group.service';
import { RecipientService } from '../services/recipient.service';

export interface RecipientGroupDialogData {
  group?: RecipientGroup;
  isEdit: boolean;
}

@Component({
    selector: 'app-recipient-group-dialog',
    templateUrl: './recipient-group-dialog.component.html',
    styleUrl: './recipient-group-dialog.component.css',
    standalone: false
})
export class RecipientGroupDialogComponent implements OnInit {
  groupForm: FormGroup;
  availableRecipients: Recipient[] = [];
  selectedRecipients: Recipient[] = [];
  recipientControl = new FormControl();
  filteredRecipients: Observable<Recipient[]>;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RecipientGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RecipientGroupDialogData,
    private groupService: RecipientGroupService,
    private recipientService: RecipientService,
    private snackBar: MatSnackBar
  ) {
    this.groupForm = this.fb.group({
      aliasName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });

    this.filteredRecipients = this.recipientControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterRecipients(value || ''))
    );
  }

  ngOnInit() {
    // Load recipients first, then handle edit mode
    this.loadRecipients().then(() => {
      if (this.data.isEdit && this.data.group) {
        this.groupForm.patchValue({
          aliasName: this.data.group.aliasName,
          description: this.data.group.description || ''
        });
        
        // If we have full recipient objects, use them
        if (this.data.group.recipients && this.data.group.recipients.length > 0) {
          this.selectedRecipients = [...this.data.group.recipients];
        } 
        // Otherwise, we need to load recipients based on recipientIds
        else if (this.data.group.recipientIds && this.data.group.recipientIds.length > 0) {
          this.loadSelectedRecipientsFromIds(this.data.group.recipientIds);
        }
      }
    });
  }

  private loadRecipients(): Promise<void> {
    this.loading = true;
    
    return new Promise((resolve, reject) => {
      // Load all recipients for selection
      this.recipientService.getRecipients(1, 1000).subscribe({
        next: (response) => {
          this.availableRecipients = response.recipients;
          this.loading = false;
          resolve();
        },
        error: (error) => {
          console.error('Error loading recipients:', error);
          this.snackBar.open('Failed to load recipients', 'Close', { duration: 3000 });
          this.loading = false;
          reject(error);
        }
      });
    });
  }

  private loadSelectedRecipientsFromIds(recipientIds: string[]) {
    // Find selected recipients from the available recipients list
    this.selectedRecipients = this.availableRecipients.filter(recipient => 
      recipient._id && recipientIds.includes(recipient._id)
    );
    
    if (this.selectedRecipients.length !== recipientIds.length) {
      console.warn(`Could not find all recipients. Expected ${recipientIds.length}, found ${this.selectedRecipients.length}`);
    }
  }

  private _filterRecipients(value: string): Recipient[] {
    if (typeof value !== 'string') {
      return this.availableRecipients.filter(recipient => !this.isRecipientSelected(recipient));
    }
    
    const filterValue = value.toLowerCase();
    return this.availableRecipients.filter(recipient => 
      !this.isRecipientSelected(recipient) &&
      (recipient.name?.toLowerCase().includes(filterValue) ||
       recipient.email?.toLowerCase().includes(filterValue) ||
       recipient.companyName?.toLowerCase().includes(filterValue))
    );
  }

  isRecipientSelected(recipient: Recipient): boolean {
    if (!recipient || !recipient._id) {
      return false;
    }
    return this.selectedRecipients.some(selected => selected._id === recipient._id);
  }

  addRecipient(recipient: Recipient) {
    if (recipient && recipient._id && !this.isRecipientSelected(recipient)) {
      this.selectedRecipients.push(recipient);
      this.recipientControl.setValue(''); // Clear the input field
      
      // Force update the filtered recipients
      this.filteredRecipients = this.recipientControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filterRecipients(value || ''))
      );
    }
  }

  onRecipientSelected(event: any, recipient: Recipient) {
    if (event.isUserInput) {
      this.addRecipient(recipient);
    }
  }

  removeRecipient(recipient: Recipient) {
    this.selectedRecipients = this.selectedRecipients.filter(
      selected => selected._id !== recipient._id
    );
  }

  getDisplayName(recipient: Recipient | null): string {
    // For the autocomplete input display, we want to keep it empty
    // The actual display happens in the dropdown options
    return '';
  }

  onSubmit() {
    if (this.groupForm.valid && this.selectedRecipients.length > 0) {
      const formValue = this.groupForm.value;
      const groupData: Partial<RecipientGroup> = {
        aliasName: formValue.aliasName?.trim(),
        description: formValue.description?.trim() || '',
        recipientIds: this.selectedRecipients.map(r => r._id!).filter(id => id), // Filter out any undefined IDs
        recipients: this.selectedRecipients
      };

      // Validate that we have valid recipient IDs
      if (groupData.recipientIds!.length !== this.selectedRecipients.length) {
        this.snackBar.open('Some selected recipients are invalid', 'Close', { duration: 3000 });
        return;
      }

      this.dialogRef.close(groupData);
    } else {
      if (this.selectedRecipients.length === 0) {
        this.snackBar.open('Please select at least one recipient', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      }
      this.groupForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const field = this.groupForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field?.hasError('minlength')) {
      return `${fieldName} must be at least 2 characters`;
    }
    return '';
  }
}
