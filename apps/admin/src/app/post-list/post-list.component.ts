import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PostService, BlogPost } from '@foliokit/cms-core';

@Component({
  selector: 'admin-post-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="p-6">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold">Posts</h1>
        <button mat-raised-button color="primary" (click)="newPost()">
          New Post
        </button>
      </div>

      @if (isLoading()) {
        <div class="flex justify-center py-16">
          <mat-spinner diameter="40" />
        </div>
      } @else if (posts().length === 0) {
        <div class="py-16 text-center text-gray-500">No posts yet.</div>
      } @else {
        <mat-table [dataSource]="posts()" class="w-full">
          <ng-container matColumnDef="title">
            <mat-header-cell *matHeaderCellDef>Title</mat-header-cell>
            <mat-cell *matCellDef="let post">{{ post.title }}</mat-cell>
          </ng-container>

          <ng-container matColumnDef="status">
            <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
            <mat-cell *matCellDef="let post">{{ post.status }}</mat-cell>
          </ng-container>

          <ng-container matColumnDef="publishedAt">
            <mat-header-cell *matHeaderCellDef>Published At</mat-header-cell>
            <mat-cell *matCellDef="let post">
              {{ post.publishedAt?.toDate() | date: 'mediumDate' }}
            </mat-cell>
          </ng-container>

          <ng-container matColumnDef="readingTimeMinutes">
            <mat-header-cell *matHeaderCellDef>Reading Time</mat-header-cell>
            <mat-cell *matCellDef="let post">
              {{ post.readingTimeMinutes ? post.readingTimeMinutes + ' min' : '—' }}
            </mat-cell>
          </ng-container>

          <ng-container matColumnDef="actions">
            <mat-header-cell *matHeaderCellDef></mat-header-cell>
            <mat-cell *matCellDef="let post">
              <button mat-icon-button aria-label="Edit post" (click)="editPost(post)">
                <mat-icon>edit</mat-icon>
              </button>
            </mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="columns" />
          <mat-row *matRowDef="let row; columns: columns" />
        </mat-table>
      }
    </div>
  `,
})
export class PostListComponent {
  private readonly postService = inject(PostService);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(true);
  protected readonly columns = [
    'title',
    'status',
    'publishedAt',
    'readingTimeMinutes',
    'actions',
  ];

  protected readonly posts = toSignal(
    this.postService.getAllPosts().pipe(tap(() => this.isLoading.set(false))),
    { initialValue: [] as BlogPost[] },
  );

  protected newPost(): void {
    this.router.navigate(['/posts/new']);
  }

  protected editPost(post: BlogPost): void {
    this.router.navigate(['/posts', post.id, 'edit']);
  }
}
