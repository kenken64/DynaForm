import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ui-button',
  standalone: true,
  template: `
    <button 
      [type]="type"
      [disabled]="disabled"
      [class]="buttonClasses"
      (click)="onClick.emit($event)">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    /* Base unstyled button - add your own styles */
    button {
      border: none;
      background: none;
      padding: 0;
      margin: 0;
      font: inherit;
      cursor: pointer;
      outline: none;
    }
    
    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  `]
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() variant: 'primary' | 'secondary' | 'outline' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() class = '';
  
  @Output() onClick = new EventEmitter<Event>();
  
  get buttonClasses(): string {
    return `btn btn-${this.variant} btn-${this.size} ${this.class}`.trim();
  }
}
