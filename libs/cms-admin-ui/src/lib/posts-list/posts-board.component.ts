import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { PostsListStore } from './posts-list.store';
import { PostsDraftColumnComponent } from './posts-draft-column.component';
import { PostsQueueColumnComponent } from './posts-queue-column.component';
import { PostsPublishedColumnComponent } from './posts-published-column.component';

@Component({
  selector: 'folio-posts-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PostsDraftColumnComponent,
    PostsQueueColumnComponent,
    PostsPublishedColumnComponent,
  ],
  host: { class: 'block h-full' },
  template: `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      <folio-posts-draft-column
        [posts]="store.draftPosts()"
        (postSelected)="postSelected.emit($event)"
      />

      <folio-posts-queue-column
        [posts]="store.scheduledPosts()"
        (postSelected)="postSelected.emit($event)"
        (reorderQueue)="store.reorderQueue($event.previousIndex, $event.currentIndex)"
      />

      <folio-posts-published-column
        [posts]="store.publishedPosts()"
        [archivedPosts]="store.archivedPosts()"
        (postSelected)="postSelected.emit($event)"
      />
    </div>
  `,
})
export class PostsBoardComponent {
  protected readonly store = inject(PostsListStore);
  postSelected = output<string>();
}
