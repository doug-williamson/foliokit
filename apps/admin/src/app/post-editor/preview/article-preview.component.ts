import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MarkdownComponent } from '@foliokit/cms-markdown';
import { PostEditorStore } from '@foliokit/cms-admin-ui';
import { Author, AuthorService } from '@foliokit/cms-core';

@Component({
  selector: 'folio-article-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MarkdownComponent],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 20px;
      }
    `,
  ],
  template: `
    <div class="max-w-prose mx-auto w-full">
      @if (store.post(); as post) {
        <!-- Cover image -->
        @if (post.thumbnailUrl) {
          <img
            class="w-full aspect-video object-cover"
            [src]="post.thumbnailUrl"
            [alt]="post.thumbnailAlt ?? post.title"
          />
        }

        <div class="px-6 py-8">
          <!-- Title -->
          @if (post.title) {
            <h1 class="text-3xl font-bold leading-tight mb-2">{{ post.title }}</h1>
          } @else {
            <h1 class="text-3xl font-bold leading-tight mb-2 opacity-30">Untitled post</h1>
          }

          <!-- Subtitle -->
          @if (post.subtitle) {
            <h2 class="text-xl font-normal mb-4" style="color: var(--text-secondary)">{{ post.subtitle }}</h2>
          }

          <!-- Meta row: Author · date · read time -->
          <p class="text-sm mb-8" style="color: var(--text-muted)">
            @if (author()?.displayName; as name) {
              {{ name }} ·
            }
            {{ post.publishedAt | date: 'MMM d, yyyy' }}
            @if (post.readingTimeMinutes) {
              · {{ post.readingTimeMinutes }} min read
            }
          </p>

          <!-- Markdown content or empty state -->
          @if (post.content) {
            <folio-markdown
              [content]="post.content"
              [embeddedMedia]="post.embeddedMedia"
            />
          } @else {
            <div class="flex items-center justify-center py-16 text-sm" style="color: var(--text-disabled)">
              No content yet.
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ArticlePreviewComponent {
  readonly store = inject(PostEditorStore);

  private readonly authorService = inject(AuthorService);
  private readonly authorId = computed(() => this.store.post()?.authorId ?? null);
  protected readonly author = toSignal(
    toObservable(this.authorId).pipe(
      switchMap((id) => (id ? this.authorService.getById(id) : of(null))),
    ),
    { initialValue: null as Author | null },
  );
}
