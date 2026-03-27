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
  `],
  template: `
    <div class="flex flex-col h-full">
      <div class="page-header">
        <div class="page-header-title">
          <h1 class="page-heading">Posts</h1>
        </div>
        <div class="page-header-actions">
          <button mat-flat-button (click)="newPost()">New Post</button>
        </div>
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
