import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'radix-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div *ngIf="hasHeader" class="card-header">
        <ng-content select="[slot=header]"></ng-content>
      </div>
      <div class="card-content">
        <ng-content></ng-content>
      </div>
      <div *ngIf="hasFooter" class="card-footer">
        <ng-content select="[slot=footer]"></ng-content>
      </div>
    </div>
  `,
  styleUrl: './radix-card.component.css'
})
export class RadixCardComponent {
  @Input() hasHeader = false;
  @Input() hasFooter = false;
}
