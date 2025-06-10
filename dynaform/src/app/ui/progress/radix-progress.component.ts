import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  RdxProgressRootDirective,
  RdxProgressIndicatorDirective
} from '@radix-ng/primitives/progress';

@Component({
  selector: 'radix-progress',
  standalone: true,
  imports: [
    CommonModule,
    RdxProgressRootDirective,
    RdxProgressIndicatorDirective
  ],
  template: `
    <div rdxProgressRoot 
         [value]="value"
         [max]="max"
         class="progress-root"
         [attr.aria-label]="label">
      <div rdxProgressIndicator 
           class="progress-indicator"
           [style.transform]="'translateX(-' + (100 - progressPercentage) + '%)'">
      </div>
    </div>
  `,
  styleUrl: './radix-progress.component.css'
})
export class RadixProgressComponent {
  @Input() value: number = 0;
  @Input() max: number = 100;
  @Input() label?: string;

  get progressPercentage(): number {
    return Math.min(Math.max((this.value / this.max) * 100, 0), 100);
  }
}

@Component({
  selector: 'radix-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-wrapper" [attr.aria-label]="label">
      <div class="spinner" [class]="size">
        <svg class="spinner-svg" viewBox="0 0 50 50">
          <circle
            class="spinner-circle"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-dasharray="31.416"
            stroke-dashoffset="31.416">
          </circle>
        </svg>
      </div>
      <span *ngIf="showLabel && label" class="spinner-label">{{ label }}</span>
    </div>
  `,
  styleUrl: './radix-progress.component.css'
})
export class RadixSpinnerComponent {
  @Input() size: 'sm' | 'default' | 'lg' = 'default';
  @Input() label?: string;
  @Input() showLabel = false;
}
