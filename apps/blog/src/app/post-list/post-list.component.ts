import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { map } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import type { BlogPost } from '@foliokit/cms-core';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, DatePipe, MatCardModule, MatButtonModule],
})
export class PostListComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly posts = toSignal(
    this.route.data.pipe(map((d) => d['posts'] as BlogPost[])),
    { initialValue: this.route.snapshot.data['posts'] as BlogPost[] },
  );
}
