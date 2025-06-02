import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Recipient } from '../interfaces/recipient.interface';

export interface RecipientDialogData {
  mode: 'create' | 'edit';
  recipient?: Recipient;
}

@Component({
  selector: 'app-recipient-dialog',
  templateUrl: './recipient-dialog.component.html',
  styleUrl: './recipient-dialog.component.css'
})
export class RecipientDialogComponent implements OnInit {
  recipientForm: FormGroup;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RecipientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RecipientDialogData
  ) {
    this.isEditMode = data.mode === 'edit';
    
    // Initialize form
    this.recipientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      jobTitle: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      companyName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  ngOnInit() {
    // If editing, populate form with existing data
    if (this.isEditMode && this.data.recipient) {
      this.recipientForm.patchValue({
        name: this.data.recipient.name,
        jobTitle: this.data.recipient.jobTitle,
        email: this.data.recipient.email,
        companyName: this.data.recipient.companyName
      });
    }
  }

  onSubmit(): void {
    if (this.recipientForm.valid) {
      const formValue = this.recipientForm.value;
      this.dialogRef.close(formValue);
    } else {
      // Mark all fields as touched to show validation errors
      this.recipientForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Helper methods for form validation
  getFieldError(fieldName: string): string {
    const field = this.recipientForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'name': 'Name',
      'jobTitle': 'Job Title',
      'email': 'Email',
      'companyName': 'Company Name'
    };
    return displayNames[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.recipientForm.get(fieldName);
    return !!(field && field.errors && field.touched);
  }
}
