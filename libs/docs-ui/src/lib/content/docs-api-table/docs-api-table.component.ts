import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { ApiTableRow } from '../../models/api-table-row.model';

@Component({
  selector: 'docs-api-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule],
  template: `
    <div class="overflow-x-auto rounded-lg border border-[var(--mat-sys-outline-variant)]">
      <table mat-table [dataSource]="rows()" class="w-full">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef class="w-36">Name</th>
          <td mat-cell *matCellDef="let row">
            <code class="text-[var(--mat-sys-primary)] font-medium text-sm">{{ row.name }}</code>
            @if (row.required) {
              <sup class="text-red-500 ml-0.5 font-bold" title="Required">*</sup>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef class="w-44">Type</th>
          <td mat-cell *matCellDef="let row">
            <code class="text-[var(--mat-sys-tertiary)] text-sm">{{ row.type }}</code>
          </td>
        </ng-container>

        <ng-container matColumnDef="default">
          <th mat-header-cell *matHeaderCellDef class="w-32">Default</th>
          <td mat-cell *matCellDef="let row" class="text-sm text-[var(--mat-sys-on-surface-variant)]">
            @if (row.default !== undefined && row.default !== null) {
              <code>{{ row.default }}</code>
            } @else {
              <span class="opacity-40">&mdash;</span>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Description</th>
          <td mat-cell *matCellDef="let row" class="text-sm text-[var(--mat-sys-on-surface-variant)] py-3">
            {{ row.description }}
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    </div>
  `,
})
export class DocsApiTableComponent {
  readonly rows = input.required<ApiTableRow[]>();
  readonly columns = ['name', 'type', 'default', 'description'];
}
