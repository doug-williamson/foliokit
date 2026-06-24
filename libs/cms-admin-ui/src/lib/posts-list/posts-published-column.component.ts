import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { filter } from 'rxjs/operators';
import { BlogPost } from '@foliokit/cms-core';
import {
  RhombusButtonComponent,
  RhombusCardComponent,
  RhombusConfirmService,
  RhombusEmptyStateComponent,
  RhombusOverflowMenuComponent,
  type OverflowMenuItem,
} from '@rhombuskit/core';

@Component({
  selector: 'folio-posts-published-column',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RhombusButtonComponent,
    RhombusCardComponent,
    RhombusEmptyStateComponent,
    RhombusOverflowMenuComponent,
  ],
  host: { class: 'contents' },
  styles: [`
    .column-header {
      border-left: 3px solid var(--green-600);
      padding-left: 12px;
    }
    :host-context([data-theme="dark"]) .column-header {
      border-left-color: var(--green-400);
    }
    .post-item {
      transition: box-shadow var(--motion-duration-base) var(--motion-ease-standard), transform var(--motion-duration-base) var(--motion-ease-standard), background-color var(--motion-duration-fast) var(--motion-ease-standard);
    }
    .post-item:hover {
      box-shadow: var(--shadow-sm);
      transform: translateY(-1px);
    }
  `],
  template: `
    <rhombus-card variant="outlined" [hasHeader]="false" class="flex flex-col overflow-hidden page-enter" style="animation-delay: 120ms">
      <div class="column-header shrink-0 flex items-center gap-2 px-4 py-3 border-b border-[var(--mat-sys-outline-variant)]">
        <span class="text-sm font-semibold">Published</span>
        <span class="inline-flex items-center justify-center rounded-full bg-[var(--mat-sys-secondary-container)] text-[var(--mat-sys-on-secondary-container)] text-xs font-medium min-w-[1.25rem] h-5 px-1.5">
          {{ posts().length }}
        </span>
      </div>

      <div class="kanban-column-body flex-1 divide-y divide-[var(--mat-sys-outline-variant)]">
        @for (post of posts(); track post.id) {
          <div
            class="post-item flex items-center hover:bg-[var(--mat-sys-surface-container-high)]"
          >
            <button
              type="button"
              class="flex-1 flex items-center justify-between gap-3 px-4 py-3 text-left min-w-0"
              (click)="postSelected.emit(post.id)"
            >
              <span class="truncate text-sm font-medium">{{ post.title || '(Untitled)' }}</span>
              <span class="shrink-0 text-xs opacity-50">{{ post.publishedAt | date: 'mediumDate' }}</span>
            </button>
            <!-- Non-interactive wrapper: stops the menu click from selecting the row. -->
            <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
            <span class="shrink-0 mr-1" (click)="$event.stopPropagation()">
              <rhombus-overflow-menu
                [items]="cardMenuItems(post)"
                ariaLabel="Post actions"
              />
            </span>
          </div>
        } @empty {
          <rhombus-empty-state
            icon="check_circle_outline"
            heading="Nothing published yet"
            body="Your live posts will appear here."
          />
        }

        @if (showArchived()) {
          @for (post of archivedPosts(); track post.id) {
            <button
              type="button"
              class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left opacity-50 hover:opacity-70 transition-opacity"
              (click)="postSelected.emit(post.id)"
            >
              <span class="truncate text-sm font-medium">{{ post.title || '(Untitled)' }}</span>
              <span class="shrink-0 text-xs">{{ post.updatedAt | date: 'mediumDate' }}</span>
            </button>
          }
        }
      </div>

      @if (archivedPosts().length > 0) {
        <div class="shrink-0 border-t border-[var(--mat-sys-outline-variant)] px-4 py-2">
          <rhombus-button
            appearance="text"
            variant="secondary"
            class="w-full text-xs"
            [leadingIcon]="showArchived() ? 'expand_less' : 'expand_more'"
            (click)="showArchived.set(!showArchived())"
          >
            {{ showArchived() ? 'Hide archived' : 'Show archived (' + archivedPosts().length + ')' }}
          </rhombus-button>
        </div>
      }
    </rhombus-card>
  `,
})
export class PostsPublishedColumnComponent {
  private readonly confirm = inject(RhombusConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  posts = input.required<BlogPost[]>();
  archivedPosts = input.required<BlogPost[]>();
  postSelected = output<string>();
  unpublishPost = output<string>();

  protected readonly showArchived = signal(false);

  /** Card overflow menu for a published post. */
  protected cardMenuItems(post: BlogPost): OverflowMenuItem[] {
    return [{ label: 'Unpublish', action: () => this.confirmUnpublish(post) }];
  }

  protected confirmUnpublish(post: BlogPost): void {
    const title = post.title?.trim() || '(Untitled)';
    this.confirm
      .confirm({
        title: 'Unpublish post?',
        message: `“${title}” will return to draft and will no longer be visible on the live site.`,
        confirmLabel: 'Unpublish',
        cancelLabel: 'Keep published',
        variant: 'danger',
      })
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.unpublishPost.emit(post.id));
  }
}
