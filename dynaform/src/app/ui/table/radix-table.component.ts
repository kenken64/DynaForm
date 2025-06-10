import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface TableData {
  [key: string]: any;
}

@Component({
  selector: 'radix-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-wrapper">
      <table class="table">
        <thead class="table-header">
          <tr>
            <th *ngFor="let column of columns" 
                [style.width]="column.width"
                [class.sortable]="column.sortable"
                (click)="onSort(column)"
                class="table-header-cell">
              <div class="header-content">
                {{ column.label }}
                <span *ngIf="column.sortable && sortColumn === column.key" 
                      class="sort-indicator">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="table-body">
          <tr *ngFor="let row of sortedData; trackBy: trackByFn" 
              class="table-row"
              (click)="onRowClick(row)">
            <td *ngFor="let column of columns" 
                class="table-cell">
              <ng-container *ngIf="getCellTemplate(column.key) as template; else defaultCell">
                <ng-container *ngTemplateOutlet="template; context: { $implicit: row[column.key], row: row }"></ng-container>
              </ng-container>
              <ng-template #defaultCell>
                {{ row[column.key] }}
              </ng-template>
            </td>
          </tr>
          <tr *ngIf="sortedData.length === 0" class="empty-row">
            <td [attr.colspan]="columns.length" class="empty-cell">
              {{ emptyMessage }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './radix-table.component.css'
})
export class RadixTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: TableData[] = [];
  @Input() emptyMessage = 'No data available';
  @Input() sortColumn?: string;
  @Input() sortDirection: 'asc' | 'desc' = 'asc';

  @Output() sortChange = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
  @Output() rowClick = new EventEmitter<TableData>();

  private cellTemplates = new Map<string, any>();

  get sortedData(): TableData[] {
    if (!this.sortColumn) {
      return this.data;
    }

    return [...this.data].sort((a, b) => {
      const aVal = a[this.sortColumn!];
      const bVal = b[this.sortColumn!];
      
      if (aVal < bVal) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  onSort(column: TableColumn): void {
    if (!column.sortable) return;

    if (this.sortColumn === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    this.sortChange.emit({
      column: this.sortColumn,
      direction: this.sortDirection
    });
  }

  onRowClick(row: TableData): void {
    this.rowClick.emit(row);
  }

  trackByFn(index: number, item: TableData): any {
    return item['id'] || index;
  }

  getCellTemplate(columnKey: string): any {
    return this.cellTemplates.get(columnKey);
  }

  setCellTemplate(columnKey: string, template: any): void {
    this.cellTemplates.set(columnKey, template);
  }
}
