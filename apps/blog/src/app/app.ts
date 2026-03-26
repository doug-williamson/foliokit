import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs/operators';
import { SiteConfigService } from '@foliokit/cms-core';
import { AppShellComponent, SHELL_CONFIG, ShellConfig } from '@foliokit/cms-ui';
import type { NavItem } from '@foliokit/cms-core';

const DEFAULT_NAV: NavItem[] = [
  { label: 'Home', url: '/' },
  { label: 'Blog', url: '/posts' },
];

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
        nav: DEFAULT_NAV,
      }),
    },
  ],
})
export class App {
  private readonly siteConfigService = inject(SiteConfigService);

  private readonly siteConfig = toSignal(
    this.siteConfigService.getDefaultSiteConfig().pipe(take(1)),
    { initialValue: null },
  );

  protected readonly navItems = computed(() => {
    const config = this.siteConfig();
    const base = config?.nav ?? DEFAULT_NAV;
    const extra: NavItem[] = [];
    if (config?.pages?.about?.enabled) {
      extra.push({ label: 'About', url: '/about' });
    }
    if (config?.pages?.links?.enabled) {
      extra.push({ label: 'Links', url: '/links' });
    }
    const existingUrls = new Set(base.map((i) => i.url));
    return [...base, ...extra.filter((e) => !existingUrls.has(e.url))];
  });
}
