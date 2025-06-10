import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';

/**
 * Radix-NG inspired button component
 * Replace mat-button, mat-raised-button, etc.
 */
@Component({
  selector: 'rdx-button',
  standalone: true,
  template: `
    <button 
      [type]="type"
      [disabled]="disabled"
      [class]="buttonClasses"
      (click)="onClick.emit($event)"
      [attr.aria-label]="ariaLabel">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    /* Base button - completely unstyled */
    button {
      all: unset;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      line-height: 1;
      padding: 0 16px;
      height: 36px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      position: relative;
    }

    button:focus-visible {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }

    button:disabled {
      pointer-events: none;
      opacity: 0.5;
    }

    /* Variant styles */
    .btn-primary {
      background-color: #667eea;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #5a6fd8;
    }

    .btn-secondary {
      background-color: #6b7280;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #4b5563;
    }

    .btn-outline {
      background-color: transparent;
      border-color: #d1d5db;
      color: #374151;
    }

    .btn-outline:hover:not(:disabled) {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }

    .btn-ghost {
      background-color: transparent;
      color: #374151;
    }

    .btn-ghost:hover:not(:disabled) {
      background-color: #f3f4f6;
    }

    .btn-destructive {
      background-color: #ef4444;
      color: white;
    }

    .btn-destructive:hover:not(:disabled) {
      background-color: #dc2626;
    }

    /* Size variants */
    .btn-sm {
      height: 32px;
      padding: 0 12px;
      font-size: 13px;
    }

    .btn-lg {
      height: 44px;
      padding: 0 24px;
      font-size: 16px;
    }

    .btn-icon {
      width: 36px;
      padding: 0;
    }

    .btn-icon.btn-sm {
      width: 32px;
      height: 32px;
    }

    .btn-icon.btn-lg {
      width: 44px;
      height: 44px;
    }
  `]
})
export class RadixButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() iconOnly = false;
  @Input() class = '';
  @Input() ariaLabel?: string;
  
  @Output() onClick = new EventEmitter<Event>();
  
  get buttonClasses(): string {
    const classes = [
      'btn',
      `btn-${this.variant}`,
      `btn-${this.size}`,
      this.iconOnly ? 'btn-icon' : '',
      this.class
    ].filter(Boolean);
    
    return classes.join(' ');
  }
}
