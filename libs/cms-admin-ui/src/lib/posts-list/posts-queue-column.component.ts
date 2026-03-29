import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { BlogPost } from '@foliokit/cms-core';

@Component({
  selector: 'folio-posts-queue-column',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatCardModule, MatIconModule, CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder],
  host: { class: 'contents' },
  styles: [`
    .cdk-drag-preview {
      box-shadow: var(--shadow-md);
      border-radius: 4px;
      background: var(--mat-sys-surface-container-high);
    }
    .cdk-drag-placeholder { opacity: 0.3; }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0,0,0.2,1); }
    .post-list.cdk-drop-list-dragging .post-row:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0,0,0.2,1);
    }
    .column-header {
      border-left: 3px solid var(--blue-600);
      padding-left: 12px;
    }
    :host-context([data-theme="dark"]) .column-header {
      border-left-color: var(--blue-400);
    }
    .post-item {
      transition: box-shadow 0.15s ease, transform 0.15s ease, background-color 0.12s;
    }
    .post-item:hover {
      box-shadow: var(--shadow-sm);
      transform: translateY(-1px);
    }
  `],
  template: `
    <mat-card appearance="outlined" class="flex flex-col overflow-hidden page-enter" style="animation-delay: 60ms">
      <div class="column-header shrink-0 flex items-center gap-2 px-4 py-3 border-b border-[var(--mat-sys-outline-variant)]">
        <span class="text-sm font-semibold">Queued</span>
        <span class="inline-flex items-center justify-center rounded-full bg-[var(--mat-sys-secondary-container)] text-[var(--mat-sys-on-secondary-container)] text-xs font-medium min-w-[1.25rem] h-5 px-1.5">
          {{ posts().length }}
        </span>
      </div>

      <div
        class="post-list kanban-column-body flex-1 divide-y divide-[var(--mat-sys-outline-variant)]"
        cdkDropList
        (cdkDropListDropped)="onDrop($event)"
      >
        @for (post of posts(); track post.id) {
          <div class="post-item post-row flex items-center gap-2 pr-4 hover:bg-[var(--mat-sys-surface-container-high)]" cdkDrag>
            <button
              type="button"
              class="flex items-center gap-1 px-2 py-3 cursor-grab active:cursor-grabbing text-[var(--mat-sys-outline)] hover:text-[var(--mat-sys-on-surface)] transition-colors"
              cdkDragHandle
              aria-label="Drag to reorder"
            >
              <mat-icon class="text-[1.1rem] leading-none" svgIcon="drag_indicator" />
            </button>

            <button
              type="button"
              class="flex-1 flex items-center justify-between gap-3 py-3 text-left min-w-0"
              (click)="postSelected.emit(post.id)"
            >
              <span class="truncate text-sm font-medium">{{ post.title || '(Untitled)' }}</span>
              <span class="shrink-0 text-xs opacity-50">
                {{ post.scheduledPublishAt | date: 'mediumDate' }}
              </span>
            </button>

            <div *cdkDragPlaceholder class="h-12 rounded bg-[var(--mat-sys-surface-container)]"></div>
          </div>
        } @empty {
          <div class="empty-state">
            <mat-icon class="empty-state-icon" svgIcon="schedule" />
            <p class="empty-state-heading">Nothing scheduled</p>
            <p class="empty-state-body">Posts queued for future publishing will appear here.</p>
          </div>
        }
      </div>
    </mat-card>
  `,
})
export class PostsQueueColumnComponent {
  posts = input.required<BlogPost[]>();
  postSelected = output<string>();
  reorderQueue = output<{ previousIndex: number; currentIndex: number }>();

  protected onDrop(event: CdkDragDrop<BlogPost[]>): void {
    this.reorderQueue.emit({
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
    });
  }
}
