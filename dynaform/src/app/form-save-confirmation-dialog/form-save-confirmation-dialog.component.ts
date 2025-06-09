import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface FormSaveConfirmationData {
  formTitle: string;
  formId: string;
  savedAt: string;
  isUpdate: boolean;
}

@Component({
  selector: 'app-form-save-confirmation-dialog',
  templateUrl: './form-save-confirmation-dialog.component.html',
  styleUrl: './form-save-confirmation-dialog.component.css'
})
export class FormSaveConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<FormSaveConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FormSaveConfirmationData
  ) {}

  onContinueEditing(): void {
    this.dialogRef.close('continue');
  }

  onViewForms(): void {
    this.dialogRef.close('viewForms');
  }

  onPreviewForm(): void {
    this.dialogRef.close('preview');
  }

  formatDateTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return dateString;
    }
  }
}
