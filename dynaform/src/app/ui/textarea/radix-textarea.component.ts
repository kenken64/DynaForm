import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RdxLabelDirective } from '@radix-ng/primitives/label';

@Component({
  selector: 'radix-textarea',
  standalone: true,
  imports: [CommonModule, RdxLabelDirective],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadixTextareaComponent),
      multi: true
    }
  ],
  template: `
    <div class="textarea-wrapper">
      <label *ngIf="label" rdxLabel [for]="id" class="textarea-label">{{ label }}</label>
      <div class="textarea-container">
        <textarea
          [id]="id"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [rows]="rows"
          [value]="value"
          [class]="textareaClasses"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus.emit($event)">
        </textarea>
      </div>
      <div *ngIf="errorMessage" class="textarea-error">{{ errorMessage }}</div>
      <div *ngIf="helperText && !errorMessage" class="textarea-helper">{{ helperText }}</div>
    </div>
  `,
  styleUrl: './radix-textarea.component.css'
})
export class RadixTextareaComponent implements ControlValueAccessor {
  @Input() id?: string;
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() disabled = false;
  @Input() errorMessage?: string;
  @Input() helperText?: string;
  @Input() rows: number = 4;
  @Input() resize: 'none' | 'vertical' | 'horizontal' | 'both' = 'vertical';

  @Output() onFocus = new EventEmitter<FocusEvent>();

  value = '';

  private onChange = (value: string) => {};
  private onTouched = () => {};

  get textareaClasses(): string {
    const classes = ['textarea-field'];
    if (this.errorMessage) {
      classes.push('textarea-error-state');
    }
    classes.push(`textarea-resize-${this.resize}`);
    return classes.join(' ');
  }

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
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
