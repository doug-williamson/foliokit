import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { PostsListStore } from './posts-list.store';
import { PostsDraftColumnComponent } from './posts-draft-column.component';
import { PostsPublishedColumnComponent } from './posts-published-column.component';

@Component({
  selector: 'folio-posts-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PostsDraftColumnComponent, PostsPublishedColumnComponent],
  host: { class: 'block h-full' },
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 h-full px-4 sm:px-6 pb-4 pt-4">
      <folio-posts-draft-column
        [posts]="store.draftPosts()"
        (postSelected)="postSelected.emit($event)"
      />

      <folio-posts-published-column
        [posts]="store.publishedPosts()"
        [archivedPosts]="store.archivedPosts()"
        (postSelected)="postSelected.emit($event)"
        (unpublishPost)="store.unpublishPost($event)"
      />
    </div>
  `,
})
export class PostsBoardComponent {
  protected readonly store = inject(PostsListStore);
  postSelected = output<string>();
}
