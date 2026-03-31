import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { concat, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import type { NavItem, SiteConfig } from '@foliokit/cms-core';
import { SiteConfigService } from '@foliokit/cms-core';
import { AppShellComponent, FolioSkeletonComponent, SHELL_CONFIG, ShellConfig } from '@foliokit/cms-ui';

const DEFAULT_NAV: NavItem[] = [
  { label: 'Home', url: '/' },
  { label: 'Blog', url: '/posts' },
];

type NavLoadState =
  | { pending: true }
  | { pending: false; config: SiteConfig | null };

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
    FolioSkeletonComponent,
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

  private readonly navLoadState = toSignal(
    concat(
      of<NavLoadState>({ pending: true }),
      this.siteConfigService.getDefaultSiteConfig().pipe(
        take(1),
        map((config): NavLoadState => ({ pending: false, config })),
      ),
    ),
    { initialValue: { pending: true } satisfies NavLoadState },
  );

  protected readonly navPending = computed(() => this.navLoadState().pending);

  private readonly siteConfig = computed((): SiteConfig | null | undefined => {
    const s = this.navLoadState();
    return s.pending ? undefined : s.config;
  });

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
