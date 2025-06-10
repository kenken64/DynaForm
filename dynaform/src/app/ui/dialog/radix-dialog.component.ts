import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'radix-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Trigger -->
    <ng-content select="[slot=trigger]"></ng-content>

    <!-- Modal overlay and content -->
    <div *ngIf="open" class="dialog-overlay" (click)="onOverlayClick($event)">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <!-- Close button -->
        <button *ngIf="showCloseButton" 
                (click)="close()" 
                class="dialog-close"
                aria-label="Close">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.1931 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.1929 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.1931 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.1929 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor"/>
          </svg>
        </button>

        <!-- Header -->
        <div *ngIf="title || description" class="dialog-header">
          <h2 *ngIf="title" class="dialog-title">{{ title }}</h2>
          <p *ngIf="description" class="dialog-description">{{ description }}</p>
        </div>

        <!-- Content -->
        <div class="dialog-body">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div *ngIf="hasFooterContent" class="dialog-footer">
          <ng-content select="[slot=footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styleUrl: './radix-dialog.component.css'
})
export class RadixDialogComponent {
  @Input() open = false;
  @Input() title?: string;
  @Input() description?: string;
  @Input() showCloseButton = true;
  @Input() closeOnOverlayClick = true;

  @Output() openChange = new EventEmitter<boolean>();

  get hasFooterContent(): boolean {
    // This would need to be implemented with content projection detection
    // For now, we'll assume footer content exists if this dialog is meant to have it
    return true;
  }

  close(): void {
    this.open = false;
    this.openChange.emit(false);
  }

  openDialog(): void {
    this.open = true;
    this.openChange.emit(true);
  }

  onOverlayClick(event: Event): void {
    if (this.closeOnOverlayClick) {
      this.close();
    }
  }
}
