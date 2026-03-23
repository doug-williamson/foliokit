import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageService } from '@foliokit/cms-core';

@Component({
  selector: 'admin-pages-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule],
  host: { class: 'block h-full' },
  template: `
    <div class="flex flex-col h-full">
      <header class="shrink-0 flex items-center justify-between px-6 pt-6 pb-4">
        <h1 class="text-2xl font-bold">Pages</h1>
        @if (!hasLinks()) {
          <button mat-raised-button (click)="newPage('links')">
            <mat-icon>add</mat-icon>
            New Links Page
          </button>
        }
      </header>

      @if (pages() === undefined) {
        <div class="flex-1 flex items-center justify-center">
          <mat-spinner diameter="40" />
        </div>
      } @else if (!pages()?.length) {
        <div class="flex-1 flex items-center justify-center opacity-60 text-sm">
          No pages yet.
        </div>
      } @else {
        <div class="flex-1 min-h-0 overflow-auto px-6 pb-6">
          <table class="w-full text-sm border-separate border-spacing-y-1">
            <thead>
              <tr class="text-left opacity-60">
                <th class="py-2 pr-4 font-medium">Title</th>
                <th class="py-2 pr-4 font-medium">Status</th>
                <th class="py-2 font-medium">Last updated</th>
              </tr>
            </thead>
            <tbody>
              @for (page of pages(); track page.id) {
                <tr
                  class="cursor-pointer hover:opacity-80 transition-opacity"
                  (click)="openPage(page.id)"
                >
                  <td class="py-2 pr-4 font-medium">{{ page.title || 'Links Page' }}</td>
                  <td class="py-2 pr-4">
                    <mat-chip-set>
                      <mat-chip [highlighted]="page.status === 'published'">
                        {{ page.status }}
                      </mat-chip>
                    </mat-chip-set>
                  </td>
                  <td class="py-2 opacity-60">
                    {{ page.updatedAt | date: 'MMM d, y, h:mm a' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class PagesListComponent {
  private readonly pageService = inject(PageService);
  private readonly router = inject(Router);

  readonly pages = toSignal(this.pageService.getAllPages());

  readonly hasLinks = computed(() => this.pages()?.some((p) => p.type === 'links') ?? false);

  protected openPage(id: string): void {
    this.router.navigate(['/pages', id]);
  }

  protected newPage(type: 'links'): void {
    this.router.navigate(['/pages/new'], { queryParams: { pageType: type } });
  }
}
