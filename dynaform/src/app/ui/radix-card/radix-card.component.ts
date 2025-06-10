import { Component, Input } from '@angular/core';

/**
 * Radix-NG inspired card component
 * Replace mat-card
 */
@Component({
  selector: 'rdx-card',
  standalone: true,
  template: `
    <div [class]="cardClasses">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .card {
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .card-elevated {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .card-bordered {
      border: 2px solid #e5e7eb;
    }
  `]
})
export class RadixCardComponent {
  @Input() variant: 'default' | 'elevated' | 'bordered' = 'default';
  @Input() class = '';
  
  get cardClasses(): string {
    const classes = [
      'card',
      this.variant === 'elevated' ? 'card-elevated' : '',
      this.variant === 'bordered' ? 'card-bordered' : '',
      this.class
    ].filter(Boolean);
    
    return classes.join(' ');
  }
}

/**
 * Card header component
 */
@Component({
  selector: 'rdx-card-header',
  standalone: true,
  template: `
    <div class="card-header">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .card-header {
      padding: 20px 24px 16px 24px;
      border-bottom: 1px solid #f3f4f6;
    }
  `]
})
export class RadixCardHeaderComponent {}

/**
 * Card title component
 */
@Component({
  selector: 'rdx-card-title',
  standalone: true,
  template: `
    <h3 class="card-title">
      <ng-content></ng-content>
    </h3>
  `,
  styles: [`
    .card-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      line-height: 1.4;
    }
  `]
})
export class RadixCardTitleComponent {}

/**
 * Card description component
 */
@Component({
  selector: 'rdx-card-description',
  standalone: true,
  template: `
    <p class="card-description">
      <ng-content></ng-content>
    </p>
  `,
  styles: [`
    .card-description {
      margin: 4px 0 0 0;
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }
  `]
})
export class RadixCardDescriptionComponent {}

/**
 * Card content component
 */
@Component({
  selector: 'rdx-card-content',
  standalone: true,
  template: `
    <div class="card-content">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .card-content {
      padding: 20px 24px;
    }
  `]
})
export class RadixCardContentComponent {}

/**
 * Card footer component
 */
@Component({
  selector: 'rdx-card-footer',
  standalone: true,
  template: `
    <div class="card-footer">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .card-footer {
      padding: 16px 24px 20px 24px;
      border-top: 1px solid #f3f4f6;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class RadixCardFooterComponent {}
