import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Author, AuthorService } from '@foliokit/cms-core';

@Component({
  selector: 'admin-authors-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      .avatar-cell {
        width: 48px;
      }
      .actions-cell {
        width: 100px;
        text-align: right;
      }
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b shrink-0"
           style="border-color: var(--border)">
        <h1 class="text-xl font-semibold">Authors</h1>
        <button mat-flat-button (click)="router.navigate(['/authors/new'])">
          <mat-icon>add</mat-icon>
          New Author
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto">
        @if (loading()) {
          <div class="flex items-center justify-center p-12">
            <mat-spinner diameter="40" />
          </div>
        } @else if (!authors()?.length) {
          <div class="flex flex-col items-center justify-center gap-6 p-12 opacity-50 h-full">
            <mat-icon style="font-size: 5rem; width: 5rem; height: 5rem">person_off</mat-icon>
            <p>No authors yet. Create one to get started.</p>
          </div>
        } @else {
          <mat-table [dataSource]="authors()!" class="w-full" style="min-width: 0">
            <!-- Avatar column -->
            <ng-container matColumnDef="avatar">
              <mat-header-cell *matHeaderCellDef class="avatar-cell"></mat-header-cell>
              <mat-cell *matCellDef="let author" class="avatar-cell">
                @if (author.photoUrl) {
                  <img
                    [src]="author.photoUrl"
                    [alt]="author.displayName"
                    class="w-9 h-9 rounded-full object-cover"
                  />
                } @else {
                  <div class="w-9 h-9 rounded-full flex items-center justify-center"
                       style="background: color-mix(in srgb, var(--mat-sys-primary) 15%, transparent)">
                    <mat-icon style="font-size: 1.2rem; width: 1.2rem; height: 1.2rem; color: var(--mat-sys-primary)">
                      person
                    </mat-icon>
                  </div>
                }
              </mat-cell>
            </ng-container>

            <!-- Display name column -->
            <ng-container matColumnDef="displayName">
              <mat-header-cell *matHeaderCellDef>Name</mat-header-cell>
              <mat-cell *matCellDef="let author">
                <span class="font-medium">{{ author.displayName }}</span>
              </mat-cell>
            </ng-container>

            <!-- Email column -->
            <ng-container matColumnDef="email">
              <mat-header-cell *matHeaderCellDef>Email</mat-header-cell>
              <mat-cell *matCellDef="let author">
                <span class="opacity-70 text-sm">{{ author.email ?? '—' }}</span>
              </mat-cell>
            </ng-container>

            <!-- Actions column -->
            <ng-container matColumnDef="actions">
              <mat-header-cell *matHeaderCellDef class="actions-cell"></mat-header-cell>
              <mat-cell *matCellDef="let author" class="actions-cell">
                <button
                  mat-icon-button
                  matTooltip="Edit"
                  (click)="router.navigate(['/authors', author.id, 'edit'])"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  matTooltip="Delete"
                  (click)="confirmDelete(author)"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </mat-cell>
            </ng-container>

            <mat-header-row *matHeaderRowDef="displayedColumns()" />
            <mat-row *matRowDef="let row; columns: displayedColumns();" />
          </mat-table>
        }
      </div>
    </div>
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

  protected readonly displayedColumns = computed(() =>
    this.isMobile()
      ? ['avatar', 'displayName', 'actions']
      : ['avatar', 'displayName', 'email', 'actions']
  );

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
