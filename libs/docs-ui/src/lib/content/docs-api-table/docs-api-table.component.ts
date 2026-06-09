import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { RhombusDataTableComponent, type ColumnDef } from '@rhombuskit/core';
import { ApiTableRow } from '../../models/api-table-row.model';

/** Per-row cell template context emitted by `<rhombus-data-table>`. */
type Cell = { $implicit: ApiTableRow; index: number };

@Component({
  selector: 'docs-api-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RhombusDataTableComponent],
  template: `
    <rhombus-data-table
      [data]="rows()"
      [columns]="columns()"
      [paginated]="false"
    />

    <ng-template #nameCell let-row>
      <code class="text-[var(--mat-sys-primary)] font-medium text-sm">{{
        row.name
      }}</code>
      @if (row.required) {
        <sup class="text-red-500 ml-0.5 font-bold" title="Required">*</sup>
      }
    </ng-template>

    <ng-template #typeCell let-row>
      <code class="text-[var(--mat-sys-tertiary)] text-sm">{{ row.type }}</code>
    </ng-template>

    <ng-template #defaultCell let-row>
      @if (row.default !== undefined && row.default !== null) {
        <code class="text-sm text-[var(--mat-sys-on-surface-variant)]">{{
          row.default
        }}</code>
      } @else {
        <span class="opacity-40">&mdash;</span>
      }
    </ng-template>

    <ng-template #descCell let-row>
      <span class="text-sm text-[var(--mat-sys-on-surface-variant)]">{{
        row.description
      }}</span>
    </ng-template>
  `,
})
export class DocsApiTableComponent {
  readonly rows = input.required<ApiTableRow[]>();

  private readonly nameCell = viewChild<TemplateRef<Cell>>('nameCell');
  private readonly typeCell = viewChild<TemplateRef<Cell>>('typeCell');
  private readonly defaultCell = viewChild<TemplateRef<Cell>>('defaultCell');
  private readonly descCell = viewChild<TemplateRef<Cell>>('descCell');

  protected readonly columns = computed<ColumnDef<ApiTableRow>[]>(() => [
    {
      key: 'name',
      header: 'Name',
      align: 'start',
      width: '9rem',
      cellTemplate: this.nameCell(),
    },
    {
      key: 'type',
      header: 'Type',
      align: 'start',
      width: '11rem',
      cellTemplate: this.typeCell(),
    },
    {
      key: 'default',
      header: 'Default',
      align: 'start',
      width: '8rem',
      cellTemplate: this.defaultCell(),
    },
    {
      key: 'description',
      header: 'Description',
      align: 'start',
      cellTemplate: this.descCell(),
    },
  ]);
}
