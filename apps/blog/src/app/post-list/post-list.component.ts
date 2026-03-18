import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { PostService } from '@foliokit/cms-core';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, DatePipe, MatCardModule, MatButtonModule],
})
export class PostListComponent {
  private readonly postService = inject(PostService);

  protected readonly posts = toSignal(
    this.postService.getPublishedPosts(),
    { initialValue: undefined },
  );

  protected readonly loading = computed(() => this.posts() === undefined);

  protected readonly skeletons = [1, 2, 3];
}
