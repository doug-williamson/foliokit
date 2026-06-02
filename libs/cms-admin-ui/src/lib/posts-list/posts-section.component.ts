import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { BlogPost } from '@foliokit/cms-core';
import type { PostFilterStatus } from './posts-list.store';
import { PostsTableComponent } from './posts-table.component';

const DEFAULT_LIMIT = 5;

@Component({
  selector: 'folio-posts-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, PostsTableComponent],
  styles: [`
    :host {
      display: block;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px 6px;
      border-bottom: var(--border-width) solid var(--border);
    }

    .section-title {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin: 0;
    }

    .section-count {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
      padding: 1px 8px;
      border: var(--border-width) solid var(--border);
      border-radius: 999px;
    }

    .section-spacer { flex: 1; }

    .section-empty {
      padding: 16px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
    }

    .section-view-all {
      padding: 8px 16px;
      text-align: center;
    }

    .section-toggle {
      margin-left: auto;
    }

    :host + :host {
      margin-top: 8px;
    }
  `],
  template: `
    <section>
      <header class="section-header">
        <h2 class="section-title">{{ label() }}</h2>
        <span class="section-count">{{ posts().length }}</span>
        @if (collapsible()) {
          <button
            mat-icon-button
            class="section-toggle"
            type="button"
            [attr.aria-label]="isOpen() ? 'Collapse ' + label() : 'Expand ' + label()"
            (click)="toggle()"
          >
            <mat-icon [svgIcon]="isOpen() ? 'expand_less' : 'expand_more'" />
          </button>
        }
      </header>

      @if (isOpen()) {
        @if (posts().length === 0) {
          <p class="section-empty">{{ emptyLabel() }}</p>
        } @else {
          <folio-posts-table
            [posts]="visiblePosts()"
            [interactive]="false"
            (postSelected)="postSelected.emit($event)"
          />
          @if (hasMore()) {
            <div class="section-view-all">
              <button mat-button type="button" (click)="viewAllClick.emit(status())">
                View all {{ posts().length }} →
              </button>
            </div>
          }
        }
      }
    </section>
  `,
})
export class PostsSectionComponent {
  readonly label = input.required<string>();
  readonly status = input.required<PostFilterStatus>();
  readonly posts = input.required<BlogPost[]>();
  readonly emptyLabel = input<string>('Nothing here yet.');
  readonly limit = input<number>(DEFAULT_LIMIT);
  readonly collapsible = input<boolean>(false);
  readonly defaultExpanded = input<boolean>(true);

  postSelected = output<string>();
  viewAllClick = output<PostFilterStatus>();

  private readonly userExpanded = signal<boolean | null>(null);

  protected readonly isOpen = computed(() => {
    if (!this.collapsible()) return true;
    return this.userExpanded() ?? this.defaultExpanded();
  });

  protected toggle(): void {
    this.userExpanded.set(!this.isOpen());
  }

  protected readonly sortedPosts = computed(() =>
    [...this.posts()].sort((a, b) => b.updatedAt - a.updatedAt),
  );

  protected readonly visiblePosts = computed(() =>
    this.sortedPosts().slice(0, this.limit()),
  );

  protected readonly hasMore = computed(
    () => this.sortedPosts().length > this.limit(),
  );
}
