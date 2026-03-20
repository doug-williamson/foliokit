import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BlogPost } from '@foliokit/cms-core';

@Component({
  selector: 'folio-posts-draft-column',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatCardModule],
  host: { class: 'contents' },
  template: `
    <mat-card appearance="outlined" class="flex flex-col overflow-hidden">
      <div class="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-[var(--mat-sys-outline-variant)]">
        <span class="text-sm font-semibold">Draft</span>
        <span class="inline-flex items-center justify-center rounded-full bg-[var(--mat-sys-secondary-container)] text-[var(--mat-sys-on-secondary-container)] text-xs font-medium min-w-[1.25rem] h-5 px-1.5">
          {{ posts().length }}
        </span>
      </div>

      <div class="flex-1 overflow-y-auto divide-y divide-[var(--mat-sys-outline-variant)]">
        @for (post of posts(); track post.id) {
          <button
            type="button"
            class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--mat-sys-surface-container-high)] transition-colors"
            (click)="postSelected.emit(post.id)"
          >
            <span class="truncate text-sm font-medium">{{ post.title || '(Untitled)' }}</span>
            <span class="shrink-0 text-xs opacity-50">{{ post.updatedAt | date: 'mediumDate' }}</span>
          </button>
        } @empty {
          <div class="py-10 text-center text-sm opacity-40">No drafts</div>
        }
      </div>
    </mat-card>
  `,
})
export class PostsDraftColumnComponent {
  posts = input.required<BlogPost[]>();
  postSelected = output<string>();
}
