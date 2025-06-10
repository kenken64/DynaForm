import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'radix-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tooltip-wrapper" 
         (mouseenter)="showTooltip()" 
         (mouseleave)="hideTooltip()">
      <ng-content></ng-content>
      
      <div *ngIf="isVisible" 
           class="tooltip-content"
           [attr.data-side]="side">
        {{ content }}
      </div>
    </div>
  `,
  styleUrl: './radix-tooltip.component.css'
})
export class RadixTooltipComponent {
  @Input() content = '';
  @Input() side: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() delayDuration = 700;

  @Output() openChange = new EventEmitter<boolean>();

  isVisible = false;
  private timeoutId?: number;

  showTooltip(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = window.setTimeout(() => {
      this.isVisible = true;
      this.openChange.emit(true);
    }, this.delayDuration);
  }

  hideTooltip(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.isVisible = false;
    this.openChange.emit(false);
  }
}
