import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-form-data-confirmation',
  templateUrl: './form-data-confirmation.component.html',
  styleUrl: './form-data-confirmation.component.css'
})
export class FormDataConfirmationComponent {
  @Input() formId: string = '';
  @Input() formTitle: string = '';
  @Input() submissionId: string = '';
  @Input() submittedAt: string = '';
  @Input() isUpdate: boolean = false;
  @Input() filledFields: number = 0;
  @Input() totalFields: number = 0;
  @Output() viewFormData = new EventEmitter<string>();
  @Output() backToForm = new EventEmitter<void>();
  @Output() goToFormsList = new EventEmitter<void>();

  onViewFormData(): void {
    this.viewFormData.emit(this.submissionId);
  }

  onBackToForm(): void {
    this.backToForm.emit();
  }

  onGoToFormsList(): void {
    this.goToFormsList.emit();
  }

  get formattedDate(): string {
    if (!this.submittedAt) return '';
    try {
      return new Date(this.submittedAt).toLocaleString();
    } catch {
      return this.submittedAt;
    }
  }

  get completionPercentage(): number {
    if (this.totalFields === 0) return 0;
    return Math.round((this.filledFields / this.totalFields) * 100);
  }

  get actionMessage(): string {
    return this.isUpdate ? 'updated' : 'submitted';
  }

  get successTitle(): string {
    return this.isUpdate ? 'Form Data Updated Successfully!' : 'Form Data Submitted Successfully!';
  }
}
