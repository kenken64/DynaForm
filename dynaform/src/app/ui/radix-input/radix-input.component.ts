import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Radix-NG inspired form input component
 * Replace mat-form-field with mat-input
 */
@Component({
  selector: 'rdx-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses">
      <label *ngIf="label" [for]="inputId" class="label">
        {{ label }}
        <span *ngIf="required" class="required">*</span>
      </label>
      
      <div class="input-wrapper">
        <input
          [id]="inputId"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [required]="required"
          [class]="inputClasses"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
          [attr.aria-describedby]="errorId"
          [attr.aria-invalid]="hasError" />
        
        <ng-content select="[slot=suffix]"></ng-content>
      </div>
      
      <div *ngIf="hint && !hasError" class="hint">
        {{ hint }}
      </div>
      
      <div *ngIf="hasError && errorMessage" class="error" [id]="errorId">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .input-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }

    .label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      line-height: 1.4;
    }

    .required {
      color: #ef4444;
      margin-left: 2px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    input {
      flex: 1;
      height: 40px;
      padding: 0 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      color: #111827;
      background-color: white;
      transition: all 0.2s ease;
    }

    input::placeholder {
      color: #9ca3af;
    }

    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    input:disabled {
      background-color: #f9fafb;
      color: #6b7280;
      cursor: not-allowed;
    }

    .input-error input {
      border-color: #ef4444;
    }

    .input-error input:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .hint {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
    }

    .error {
      font-size: 12px;
      color: #ef4444;
      line-height: 1.4;
      font-weight: 500;
    }

    /* Size variants */
    .input-sm input {
      height: 32px;
      padding: 0 8px;
      font-size: 13px;
    }

    .input-lg input {
      height: 48px;
      padding: 0 16px;
      font-size: 16px;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadixInputComponent),
      multi: true
    }
  ]
})
export class RadixInputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text';
  @Input() disabled = false;
  @Input() required = false;
  @Input() hint?: string;
  @Input() errorMessage?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() class = '';
  
  @Output() inputChange = new EventEmitter<string>();
  @Output() inputBlur = new EventEmitter<void>();
  @Output() inputFocus = new EventEmitter<void>();
  
  value = '';
  
  private onChange = (value: string) => {};
  private onTouched = () => {};
  
  get inputId(): string {
    return `rdx-input-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  get errorId(): string {
    return `${this.inputId}-error`;
  }
  
  get hasError(): boolean {
    return !!this.errorMessage;
  }
  
  get containerClasses(): string {
    const classes = [
      'input-container',
      `input-${this.size}`,
      this.hasError ? 'input-error' : '',
      this.class
    ].filter(Boolean);
    
    return classes.join(' ');
  }
  
  get inputClasses(): string {
    return 'input';
  }
  
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }
  
  onBlur(): void {
    this.onTouched();
    this.inputBlur.emit();
  }
  
  onFocus(): void {
    this.inputFocus.emit();
  }
  
  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }
  
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
