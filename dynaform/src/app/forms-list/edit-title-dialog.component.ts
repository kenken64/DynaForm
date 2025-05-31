import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface EditTitleDialogData {
  currentTitle: string;
  formId: string;
}

@Component({
  selector: 'app-edit-title-dialog',
  template: `
    <h2 mat-dialog-title>Edit Form Title</h2>
    
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Form Title</mat-label>
        <input 
          matInput 
          [(ngModel)]="title"
          (keyup.enter)="onSave()"
          placeholder="Enter form title"
          #titleInput>
      </mat-form-field>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="!title.trim()"
        (click)="onSave()">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      min-width: 300px;
    }
    
    mat-dialog-content {
      margin: 20px 0;
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
