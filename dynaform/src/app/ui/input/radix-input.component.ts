import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RdxLabelDirective } from '@radix-ng/primitives/label';

@Component({
  selector: 'radix-input',
  standalone: true,
  imports: [CommonModule, RdxLabelDirective],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadixInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="input-wrapper">
      <label *ngIf="label" rdxLabel [for]="id" class="input-label">{{ label }}</label>
      <div class="input-container">
        <input
          [id]="id"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [value]="value"
          [class]="inputClasses"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus.emit($event)" />
      </div>
      <div *ngIf="errorMessage" class="input-error">{{ errorMessage }}</div>
      <div *ngIf="helperText && !errorMessage" class="input-helper">{{ helperText }}</div>
    </div>
  `,
  styleUrl: './radix-input.component.css'
})
export class RadixInputComponent implements ControlValueAccessor {
  @Input() id?: string;
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() type: string = 'text';
  @Input() disabled = false;
  @Input() errorMessage?: string;
  @Input() helperText?: string;
  @Input() size: 'sm' | 'default' | 'lg' = 'default';

  @Output() onFocus = new EventEmitter<FocusEvent>();

  value = '';

  private onChange = (value: string) => {};
  private onTouched = () => {};

  get inputClasses(): string {
    const classes = ['input-field', `input-${this.size}`];
    if (this.errorMessage) {
      classes.push('input-error-state');
    }
    return classes.join(' ');
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
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
