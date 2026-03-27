import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PostsListStore } from './posts-list.store';
import { PostsBoardComponent } from './posts-board.component';

@Component({
  selector: 'folio-posts-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PostsListStore],
  imports: [MatButtonModule, MatProgressSpinnerModule, PostsBoardComponent],
  host: { class: 'block h-full' },
  styles: [`
    :host { display: block; height: 100%; }

    .posts-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--border);
    }

    .posts-title {
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }

  `],
  template: `
    <div class="flex flex-col h-full">
      <div class="posts-header">
        <h1 class="posts-title">Posts</h1>
        <button mat-raised-button (click)="newPost()">New Post</button>
      </div>

      @if (store.loading()) {
        <div class="flex-1 flex items-center justify-center">
          <mat-spinner diameter="40" />
        </div>
      } @else if (store.error()) {
        <div class="flex-1 flex items-center justify-center opacity-60 text-sm">
          Failed to load posts. Please try again.
        </div>
      } @else {
        <folio-posts-board class="flex-1 min-h-0" (postSelected)="onPostSelected($event)" />
      }
    </div>
  `,
})
export class PostsListComponent implements OnInit {
  protected readonly store = inject(PostsListStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.loadPosts();
  }

  protected newPost(): void {
    this.router.navigate(['/posts/new']);
  }

  protected onPostSelected(id: string): void {
    this.router.navigate(['/posts', id, 'edit']);
  }
}
