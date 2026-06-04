import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Author, AuthorService } from '@foliokit/cms-core';
import {
  RhombusButtonComponent,
  RhombusDataTableComponent,
  RhombusEmptyStateComponent,
  type ColumnDef,
} from '@rhombuskit/core';

/** Per-row cell template context emitted by `<rhombus-data-table>`. */
type Cell = { $implicit: Author; index: number };

/**
 * Authors list page — shows all authors in a table with edit and delete
 * actions. On mobile, the email column is hidden to save horizontal space.
 */
@Component({
  selector: 'folio-authors-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RhombusButtonComponent,
    RhombusDataTableComponent,
    RhombusEmptyStateComponent,
  ],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden">
      <!-- GATE_TODO: multipleAuthors -->
      <!-- Header -->
      <div class="page-header flex items-center justify-between border-b shrink-0"
           style="border-color: color-mix(in srgb, currentColor 12%, transparent)">
        <h1 class="page-heading">Authors</h1>
        <rhombus-button variant="secondary" (click)="router.navigate(['/authors/new'])">
          New Author
        </rhombus-button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto">
        @if (loading()) {
          <div class="flex items-center justify-center p-12">
            <mat-spinner diameter="40" />
          </div>
        } @else if (!authors()?.length) {
          <rhombus-empty-state
            icon="person_off"
            heading="No authors yet. Create one to get started."
          />
        } @else {
          <rhombus-data-table
            [data]="authors()!"
            [columns]="columns()"
            [paginated]="false"
            (rowClick)="router.navigate(['/authors', $event.id, 'edit'])"
          />
        }
      </div>
    </div>

    <!-- ── Cell templates ───────────────────────────────────────────────── -->
    <ng-template #avatarCell let-author>
      @if (author.photoUrl) {
        <img
          [src]="author.photoUrl"
          [alt]="author.displayName"
          class="w-9 h-9 rounded-full object-cover"
        />
      } @else {
        <div class="w-9 h-9 rounded-full flex items-center justify-center"
             style="background: color-mix(in srgb, var(--mat-sys-primary) 15%, transparent)">
          <mat-icon style="font-size: 1.2rem; width: 1.2rem; height: 1.2rem; color: var(--mat-sys-primary)" svgIcon="person" />
        </div>
      }
    </ng-template>

    <ng-template #nameCell let-author>
      <span class="font-medium">{{ author.displayName }}</span>
    </ng-template>

    <ng-template #emailCell let-author>
      <span class="opacity-70 text-sm">{{ author.email ?? '—' }}</span>
    </ng-template>

    <ng-template #actionsCell let-author>
      <button
        mat-icon-button
        matTooltip="Edit"
        (click)="$event.stopPropagation(); router.navigate(['/authors', author.id, 'edit'])"
      >
        <mat-icon svgIcon="edit" />
      </button>
      <button
        mat-icon-button
        matTooltip="Delete"
        (click)="$event.stopPropagation(); confirmDelete(author)"
      >
        <mat-icon svgIcon="delete" />
      </button>
    </ng-template>
  `,
})
export class AuthorsListComponent implements OnInit {
  protected readonly router = inject(Router);
  private readonly authorService = inject(AuthorService);
  private readonly dialog = inject(MatDialog);

  protected readonly loading = signal(true);
  protected readonly authors = signal<Author[] | null>(null);

  private readonly isMobile = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 599px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  private readonly avatarCell = viewChild<TemplateRef<Cell>>('avatarCell');
  private readonly nameCell = viewChild<TemplateRef<Cell>>('nameCell');
  private readonly emailCell = viewChild<TemplateRef<Cell>>('emailCell');
  private readonly actionsCell = viewChild<TemplateRef<Cell>>('actionsCell');

  protected readonly columns = computed<ColumnDef<Author>[]>(() => {
    const cols: ColumnDef<Author>[] = [
      { key: 'photoUrl', header: '', width: '48px', cellTemplate: this.avatarCell() },
      { key: 'displayName', header: 'Name', align: 'start', cellTemplate: this.nameCell() },
    ];
    if (!this.isMobile()) {
      cols.push({ key: 'email', header: 'Email', align: 'start', cellTemplate: this.emailCell() });
    }
    cols.push({
      key: 'actions',
      header: '',
      align: 'end',
      width: '100px',
      cellTemplate: this.actionsCell()!,
    });
    return cols;
  });

  ngOnInit(): void {
    this.authorService.getAll().subscribe((list) => {
      this.authors.set(list);
      this.loading.set(false);
    });
  }

  protected confirmDelete(author: Author): void {
    if (!window.confirm(`Delete "${author.displayName}"? This cannot be undone.`)) return;
    this.authorService.delete(author.id).subscribe({
      next: () => {
        this.authors.update((list) => list?.filter((a) => a.id !== author.id) ?? []);
      },
      error: (err) => {
        console.error('[AuthorsListComponent] delete failed', err);
      },
    });
  }
}
