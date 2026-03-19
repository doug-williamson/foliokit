import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 gap-6">
      <h1 class="text-5xl font-bold tracking-tight" style="color: var(--mat-sys-on-surface)">
        Welcome to FolioKit Blog
      </h1>
      <p class="text-xl max-w-xl" style="color: var(--mat-sys-on-surface-variant)">
        Thoughts on Angular, web development, and building things.
      </p>
      <a mat-flat-button routerLink="/posts">
        <mat-icon>article</mat-icon>
        Read the blog
      </a>
    </div>
  `,
})
export class HomeComponent {}
