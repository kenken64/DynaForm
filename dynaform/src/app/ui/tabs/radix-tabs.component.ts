import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  RdxTabsRootDirective,
  RdxTabsListDirective,
  RdxTabsTriggerDirective,
  RdxTabsContentDirective
} from '@radix-ng/primitives/tabs';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'radix-tabs',
  standalone: true,
  imports: [
    CommonModule,
    RdxTabsRootDirective,
    RdxTabsListDirective,
    RdxTabsTriggerDirective
  ],
  template: `
    <div rdxTabsRoot 
         [defaultValue]="defaultValue"
         (valueChange)="onTabChange($event)"
         class="tabs-root">
      
      <div rdxTabsList class="tabs-list">
        <button *ngFor="let tab of tabs" 
                rdxTabsTrigger 
                [value]="tab.id"
                [disabled]="tab.disabled"
                class="tabs-trigger">
          {{ tab.label }}
        </button>
      </div>

      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './radix-tabs.component.css'
})
export class RadixTabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() defaultValue?: string;
  
  @Output() tabChange = new EventEmitter<string>();

  onTabChange(value: string | undefined): void {
    if (value) {
      this.tabChange.emit(value);
    }
  }
}

@Component({
  selector: 'radix-tab-content',
  standalone: true,
  imports: [
    CommonModule,
    RdxTabsContentDirective
  ],
  template: `
    <div rdxTabsContent [value]="value" class="tab-content">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './radix-tabs.component.css'
})
export class RadixTabContentComponent {
  @Input() value!: string;
}
