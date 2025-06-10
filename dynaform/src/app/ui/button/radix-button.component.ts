import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

@Component({
  selector: 'radix-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [disabled]="disabled"
      [type]="type"
      [class]="buttonClasses"
      (click)="onClick.emit($event)"
      (focus)="onFocus.emit($event)"
      (blur)="onBlur.emit($event)">
      <ng-content></ng-content>
    </button>
  `,
  styleUrl: './radix-button.component.css'
})
export class RadixButtonComponent {
  @Input() variant: ButtonVariant = 'default';
  @Input() size: ButtonSize = 'default';
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Output() onClick = new EventEmitter<MouseEvent>();
  @Output() onFocus = new EventEmitter<FocusEvent>();
  @Output() onBlur = new EventEmitter<FocusEvent>();

  get buttonClasses(): string {
    const baseClasses = ['button'];
    
    // Add variant class
    baseClasses.push(`btn-${this.variant}`);
    
    // Add size class
    if (this.size === 'default') {
      baseClasses.push('btn-default-size');
    } else {
      baseClasses.push(`btn-${this.size}`);
    }

    return baseClasses.join(' ');
  }
}
