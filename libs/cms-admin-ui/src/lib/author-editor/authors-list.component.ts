import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { Author, AuthorService } from '@foliokit/cms-core';
import {
  RhombusButtonComponent,
  RhombusDataTableComponent,
  RhombusEmptyStateComponent,
  RhombusIconComponent,
  RhombusPageHeaderComponent,
  RhombusSpinnerComponent,
  RhombusTooltipDirective,
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
    RhombusIconComponent,
    RhombusTooltipDirective,
    RhombusButtonComponent,
    RhombusDataTableComponent,
    RhombusEmptyStateComponent,
    RhombusPageHeaderComponent,
    RhombusSpinnerComponent,
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
      <div class="flex-1 overflow-auto">
        <div class="p-4 sm:p-6">
        <rhombus-page-header title="Authors">
          <rhombus-button slot="actions" variant="secondary" (click)="router.navigate(['/authors/new'])">
            New Author
          </rhombus-button>
        </rhombus-page-header>
        @if (loading()) {
          <div class="flex items-center justify-center p-12">
            <rhombus-spinner [diameter]="40" />
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
          <rhombus-icon name="person" ariaLabel="No photo" style="--rhombus-icon-size: 1.2rem; color: var(--mat-sys-primary)" />
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
        rhombusTooltip="Edit"
        (click)="$event.stopPropagation(); router.navigate(['/authors', author.id, 'edit'])"
      >
        <rhombus-icon name="edit" ariaLabel="Edit" />
      </button>
      <button
        mat-icon-button
        rhombusTooltip="Delete"
        (click)="$event.stopPropagation(); confirmDelete(author)"
      >
        <rhombus-icon name="delete" ariaLabel="Delete" />
      </button>
    </ng-template>
  `,
})
export class AuthorsListComponent implements OnInit {
  protected readonly router = inject(Router);
  private readonly authorService = inject(AuthorService);
  private readonly destroyRef = inject(DestroyRef);

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
    this.authorService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list) => {
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
