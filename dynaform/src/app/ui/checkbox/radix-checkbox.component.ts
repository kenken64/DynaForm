import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { 
  RdxCheckboxRootDirective, 
  RdxCheckboxInputDirective, 
  RdxCheckboxButtonDirective,
  RdxCheckboxIndicatorDirective 
} from '@radix-ng/primitives/checkbox';

@Component({
  selector: 'radix-checkbox',
  standalone: true,
  imports: [
    CommonModule,
    RdxCheckboxRootDirective,
    RdxCheckboxInputDirective,
    RdxCheckboxButtonDirective,
    RdxCheckboxIndicatorDirective
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadixCheckboxComponent),
      multi: true
    }
  ],
  template: `
    <div class="checkbox-wrapper">
      <div rdxCheckboxRoot 
           class="checkbox-root"
           [attr.data-disabled]="disabled">
        <input 
          rdxCheckboxInput
          type="checkbox"
          [checked]="checked"
          [disabled]="disabled"
          (change)="onCheckboxChange($event)"
          class="checkbox-input" />
        <button 
          rdxCheckboxButton
          type="button"
          [disabled]="disabled"
          class="checkbox-button">
          <div rdxCheckboxIndicator class="checkbox-indicator">
            <svg 
              *ngIf="checked"
              width="15" 
              height="15" 
              viewBox="0 0 15 15" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg">
              <path 
                d="m11.4669 3.72684c.40251.39465 .40251 1.0339 0 1.42855L7.875 8.89516c-.40251.3946-.40251 1.0339 0 1.4286L11.4669 13.1905c.40251.3946.40251 1.0339 0 1.4286-.40252.3946-1.0549.3946-1.4574 0L6.4175 11.3239c-.40252-.3946-1.05492-.3946-1.45743 0L1.36826 14.6191c-.40251.3946-1.05491.3946-1.45742 0-.40252-.3947-.40252-1.034 0-1.4286L3.50265 9.32371c.40252-.3947.40252-1.034 0-1.42855L.910848 4.15539c-.40252-.39465-.40252-1.0339 0-1.42855.40251-.39464 1.05491-.39464 1.45742 0L5.95999 6.36159c.40251.39465 1.05491.39465 1.45743 0L11.0095 2.72684c.40251-.39464 1.05488-.39464 1.4574 0Z" 
                fill="currentColor" />
            </svg>
          </div>
        </button>
      </div>
      <label *ngIf="label" [for]="id" class="checkbox-label">{{ label }}</label>
      <div *ngIf="errorMessage" class="checkbox-error">{{ errorMessage }}</div>
    </div>
  `,
  styleUrl: './radix-checkbox.component.css'
})
export class RadixCheckboxComponent implements ControlValueAccessor {
  @Input() id?: string;
  @Input() label?: string;
  @Input() disabled = false;
  @Input() checked = false;
  @Input() errorMessage?: string;
  
  @Output() checkedChange = new EventEmitter<boolean>();

  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  onCheckboxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.onChange(this.checked);
    this.onTouched();
    this.checkedChange.emit(this.checked);
  }

  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    this.checked = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
