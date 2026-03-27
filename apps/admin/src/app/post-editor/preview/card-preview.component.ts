import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PostEditorStore } from '@foliokit/cms-admin-ui';
import { Author, AuthorService, Tag, TagLabelPipe, TagService } from '@foliokit/cms-core';

@Component({
  selector: 'folio-card-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatCardModule, MatChipsModule, TagLabelPipe],
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
      .thumbnail-placeholder {
        background: color-mix(in srgb, var(--mat-sys-on-surface) 10%, transparent);
      }
    `,
  ],
  template: `
    <div class="p-6 max-w-sm mx-auto w-full">
      <p class="text-xs font-medium opacity-40 uppercase tracking-widest mb-3">
        Card Preview
      </p>

      @if (store.post(); as post) {
        <mat-card appearance="outlined" class="overflow-hidden">
          <!-- Thumbnail -->
          @if (post.thumbnailUrl) {
            <img
              mat-card-image
              [src]="post.thumbnailUrl"
              [alt]="post.thumbnailAlt ?? post.title"
            />
          } @else {
            <div class="thumbnail-placeholder w-full h-48 flex items-center justify-center">
              <span class="text-xs opacity-40">No thumbnail</span>
            </div>
          }

          <mat-card-header class="pt-4">
            <mat-card-title class="!text-base">
              {{ post.title || 'Untitled' }}
            </mat-card-title>
            @if (post.subtitle) {
              <mat-card-subtitle>{{ post.subtitle }}</mat-card-subtitle>
            }
          </mat-card-header>

          <mat-card-content class="mt-2">
            @if (post.excerpt) {
              <p class="text-sm opacity-70 line-clamp-3">{{ post.excerpt }}</p>
            }

            <!-- Tags -->
            @if (post.tags.length) {
              <div class="flex flex-wrap gap-1 mt-3">
                @for (tag of post.tags; track tag) {
                  <mat-chip class="!text-xs">{{ tag | tagLabel: tagLookup() }}</mat-chip>
                }
              </div>
            }

            <!-- Meta row -->
            <div class="flex items-center justify-between mt-4 text-xs opacity-50">
              <span>{{ author()?.displayName ?? 'Unknown author' }}</span>
              @if (post.publishedAt) {
                <span>{{ post.publishedAt | date: 'MMM d, y' }}</span>
              }
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <p class="opacity-40 text-sm">No post loaded.</p>
      }
    </div>
  `,
})
export class CardPreviewComponent {
  readonly store = inject(PostEditorStore);

  private readonly authorService = inject(AuthorService);
  private readonly authorId = computed(() => this.store.post()?.authorId ?? null);
  protected readonly author = toSignal(
    toObservable(this.authorId).pipe(
      switchMap((id) => (id ? this.authorService.getById(id) : of(null))),
    ),
    { initialValue: null as Author | null },
  );

  private readonly allTags = toSignal(inject(TagService).getAllTags(), {
    initialValue: [] as Tag[],
  });

  protected readonly tagLookup = computed(
    () => new Map(this.allTags().map((t) => [t.id, t])),
  );
}
