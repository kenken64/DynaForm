import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { 
  RadixDialogComponent,
  RadixInputComponent,
  RadixButtonComponent
} from '../ui';

export interface EditTitleDialogData {
  currentTitle: string;
  formId: string;
}

@Component({
    selector: 'app-edit-title-dialog',
    standalone: true,
    imports: [
      CommonModule,
      FormsModule,
      RadixDialogComponent,
      RadixInputComponent,
      RadixButtonComponent
    ],
    template: `
    <div class="dialog-content">
      <h2 class="dialog-title">Edit Form Title</h2>
      
      <div class="dialog-body">
        <radix-input
          label="Form Title"
          [(ngModel)]="title"
          (keyup.enter)="onSave()"
          placeholder="Enter form title"
          class="full-width">
        </radix-input>
      </div>
      
      <div class="dialog-actions">
        <radix-button variant="outline" (onClick)="onCancel()">
          Cancel
        </radix-button>
        <radix-button 
          variant="primary" 
          [disabled]="!title.trim()"
          (onClick)="onSave()">
          Save
        </radix-button>
      </div>
    </div>
  `,
    styles: [`
    .dialog-content {
      padding: 24px;
      width: 400px;
    }
    
    .dialog-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 16px 0;
    }
    
    .dialog-body {
      margin: 20px 0;
    }
    
    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }
    
    .full-width {
      width: 100%;
      min-width: 300px;
    }
  `]
})
export class EditTitleDialogComponent {
  title: string;

  constructor(
    public dialogRef: MatDialogRef<EditTitleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditTitleDialogData
  ) {
    this.title = data.currentTitle;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.title.trim()) {
      this.dialogRef.close(this.title.trim());
    }
  }
}
