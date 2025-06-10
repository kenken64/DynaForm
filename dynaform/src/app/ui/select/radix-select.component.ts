import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'radix-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadixSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="select-wrapper">
      <label *ngIf="label" [for]="id" class="select-label">{{ label }}</label>
      
      <select 
        [id]="id"
        [disabled]="disabled"
        [value]="value"
        (change)="onValueChange($event)"
        class="select-control"
        [class.error]="errorMessage">
        
        <option value="" disabled>{{ placeholder || 'Select an option' }}</option>
        <option 
          *ngFor="let option of options" 
          [value]="option.value"
          [disabled]="option.disabled">
          {{ option.label }}
        </option>
      </select>
      
      <div *ngIf="errorMessage" class="select-error">{{ errorMessage }}</div>
      <div *ngIf="hint && !errorMessage" class="select-hint">{{ hint }}</div>
    </div>
  `,
  styleUrl: './radix-select.component.css'
})
export class RadixSelectComponent implements ControlValueAccessor {
  @Input() id?: string;
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() disabled = false;
  @Input() errorMessage?: string;
  @Input() hint?: string;
  @Input() options: SelectOption[] = [];

  @Output() selectionChange = new EventEmitter<string>();

  value = '';

  private onChange = (value: string) => {};
  private onTouched = () => {};

  onValueChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.value = value;
    this.onChange(value);
    this.onTouched();
    this.selectionChange.emit(value);
  }

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
