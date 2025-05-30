import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-form-confirmation',
  templateUrl: './form-confirmation.component.html',
  styleUrl: './form-confirmation.component.css'
})
export class FormConfirmationComponent {
  @Input() formId: string = '';
  @Input() formName: string = '';
  @Input() savedAt: string = '';
  @Output() viewForm = new EventEmitter<string>();
  @Output() createNew = new EventEmitter<void>();

  onViewForm(): void {
    this.viewForm.emit(this.formId);
  }

  onCreateNew(): void {
    this.createNew.emit();
  }

  get formattedDate(): string {
    if (!this.savedAt) return '';
    try {
      return new Date(this.savedAt).toLocaleString();
    } catch {
      return this.savedAt;
    }
  }
}
