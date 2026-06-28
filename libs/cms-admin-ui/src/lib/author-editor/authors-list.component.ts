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
import { filter, map } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Author, AuthorService } from '@foliokit/cms-core';
import {
  RhombusAvatarComponent,
  RhombusButtonComponent,
  RhombusConfirmService,
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
    RhombusAvatarComponent,
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
      <rhombus-avatar [src]="author.photoUrl ?? null" [name]="author.displayName" size="md" />
    </ng-template>

    <ng-template #nameCell let-author>
      <span class="font-medium">{{ author.displayName }}</span>
    </ng-template>

    <ng-template #emailCell let-author>
      <span class="opacity-70 text-sm">{{ author.email ?? '—' }}</span>
    </ng-template>

    <ng-template #actionsCell let-author>
      <div class="flex items-center justify-end gap-1">
        <rhombus-button
          iconButton
          variant="ghost"
          ariaLabel="Edit"
          rhombusTooltip="Edit"
          (click)="$event.stopPropagation(); router.navigate(['/authors', author.id, 'edit'])"
        >
          <rhombus-icon name="edit" />
        </rhombus-button>
        <rhombus-button
          iconButton
          variant="danger"
          appearance="text"
          ariaLabel="Delete"
          rhombusTooltip="Delete"
          (click)="$event.stopPropagation(); confirmDelete(author)"
        >
          <rhombus-icon name="delete" />
        </rhombus-button>
      </div>
    </ng-template>
  `,
})
export class AuthorsListComponent implements OnInit {
  protected readonly router = inject(Router);
  private readonly authorService = inject(AuthorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = inject(RhombusConfirmService);

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
      width: '120px',
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
    const name = author.displayName?.trim() || 'this author';
    this.confirm
      .confirm({
        title: 'Delete author?',
        message: `Permanently delete "${name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        variant: 'danger',
      })
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.authorService.delete(author.id).subscribe({
          next: () => {
            this.authors.update((list) => list?.filter((a) => a.id !== author.id) ?? []);
          },
          error: (err) => {
            console.error('[AuthorsListComponent] delete failed', err);
          },
        });
      });
  }
}
