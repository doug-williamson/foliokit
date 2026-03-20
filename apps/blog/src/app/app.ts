import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AppShellComponent, SHELL_CONFIG, ShellConfig } from '@foliokit/cms-ui';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AppShellComponent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
  ],
  providers: [
    {
      provide: SHELL_CONFIG,
      useFactory: (): ShellConfig => ({
        appName: 'FolioKit Blog',
        showAuth: false,
        nav: [
          { label: 'Home', url: '/' },
          { label: 'Posts', url: '/posts' },
        ],
      }),
    },
  ],
})
export class App {
  private readonly config = inject(SHELL_CONFIG);
  protected readonly navItems = this.config.nav ?? [];
}
