import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RdxToggleDirective } from '@radix-ng/primitives/toggle';
import { RdxLabelDirective } from '@radix-ng/primitives/label';

@Component({
  selector: 'radix-toggle',
  standalone: true,
  imports: [
    CommonModule,
    RdxToggleDirective,
    RdxLabelDirective
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadixToggleComponent),
      multi: true
    }
  ],
  template: `
    <div class="toggle-wrapper">
      <label *ngIf="label" rdxLabel [for]="id" class="toggle-label">{{ label }}</label>
      
      <button rdxToggle
              [id]="id"
              [pressed]="pressed"
              [disabled]="disabled"
              (pressedChange)="onToggleChange($event)"
              class="toggle-button"
              [class.pressed]="pressed">
        <ng-content></ng-content>
      </button>
      
      <div *ngIf="helperText" class="toggle-helper">{{ helperText }}</div>
    </div>
  `,
  styleUrl: './radix-toggle.component.css'
})
export class RadixToggleComponent implements ControlValueAccessor {
  @Input() id?: string;
  @Input() label?: string;
  @Input() disabled = false;
  @Input() pressed = false;
  @Input() helperText?: string;
  
  @Output() toggleChange = new EventEmitter<boolean>();

  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  onToggleChange(pressed: boolean): void {
    this.pressed = pressed;
    this.onChange(pressed);
    this.onTouched();
    this.toggleChange.emit(pressed);
  }

  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    this.pressed = value || false;
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

@Component({
  selector: 'radix-switch',
  standalone: true,
  imports: [
    CommonModule,
    RdxLabelDirective
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadixSwitchComponent),
      multi: true
    }
  ],
  template: `
    <div class="switch-wrapper">
      <label *ngIf="label" rdxLabel [for]="id" class="switch-label">{{ label }}</label>
      
      <button class="switch-root"
              [id]="id"
              [disabled]="disabled"
              [attr.aria-checked]="checked"
              [class.checked]="checked"
              (click)="onSwitchToggle()">
        <span class="switch-thumb" [class.checked]="checked"></span>
      </button>
      
      <div *ngIf="helperText" class="switch-helper">{{ helperText }}</div>
    </div>
  `,
  styleUrl: './radix-toggle.component.css'
})
export class RadixSwitchComponent implements ControlValueAccessor {
  @Input() id?: string;
  @Input() label?: string;
  @Input() disabled = false;
  @Input() checked = false;
  @Input() helperText?: string;
  
  @Output() switchChange = new EventEmitter<boolean>();

  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  onSwitchToggle(): void {
    if (!this.disabled) {
      this.checked = !this.checked;
      this.onChange(this.checked);
      this.onTouched();
      this.switchChange.emit(this.checked);
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: boolean): void {
    this.checked = value || false;
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
