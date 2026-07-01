import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import {
  RhombusAppShellComponent,
  RhombusNavListComponent,
  type RhombusNavSection,
  RhombusShellFooterDirective,
  RhombusThemeMenuComponent,
} from '@rhombuskit/core';
import { doc, getDoc } from 'firebase/firestore';
import { concat, of } from 'rxjs';
import { filter, map, startWith, take } from 'rxjs/operators';
import type { SiteConfig } from '@foliokit/cms-core';

interface NavItem {
  label: string;
  url: string;
}
import {
  FIRESTORE,
  SITE_ID,
  SiteConfigService,
  getPlanFeatures,
  isBlogPageNavEnabled,
} from '@foliokit/cms-core';
import type { BillingRecord } from '@foliokit/cms-core';
import {
  FolioSkeletonComponent,
  SHELL_CONFIG,
  ShellConfig,
} from '@foliokit/cms-ui';

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
    RhombusAppShellComponent,
    RhombusShellFooterDirective,
    RhombusThemeMenuComponent,
    RouterOutlet,
    RouterLink,
    RhombusNavListComponent,
    FolioSkeletonComponent,
  ],
  styles: [
    `
      .blog-nav {
        display: block;
        padding-top: 8px;
      }

      .blog-nav .nav-skeleton {
        height: 40px;
        margin: 0 8px;
        padding: 0 8px;
        display: flex;
        align-items: center;
        pointer-events: none;
      }

      /* ── Shell brand (projected into rhombus-app-shell [shellBrand]) ──
         Re-homed from folio-app-shell as blog now consumes rhombus-app-shell
         directly. */
      .folio-shell-brand {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        text-decoration: none;
        color: inherit;
        border-radius: var(--r-sm);
      }

      .folio-shell-brand:focus-visible {
        outline: 2px solid var(--focus-border);
        outline-offset: 2px;
      }

      .folio-shell-brand:hover .folio-app-name {
        color: var(--text-accent);
      }

      .folio-logo-mark {
        position: relative;
        width: 30px;
        height: 30px;
        background: var(--logo-bg);
        border-radius: var(--r-md);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .folio-logo-mark-f {
        font-family: var(--font-display);
        font-size: 17px;
        font-weight: 900;
        color: var(--logo-text);
        line-height: 1;
      }

      .folio-logo-dot {
        position: absolute;
        bottom: 5px;
        right: 5px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--logo-dot);
      }

      .folio-app-name {
        font-family: var(--font-display);
        font-size: 17px;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: 0.04em;
        margin-left: 6px;
        white-space: nowrap;
      }

      .folio-custom-logo {
        height: 32px;
        width: auto;
        object-fit: contain;
        display: block;
        flex-shrink: 0;
      }

      /* ── Powered-by footer (projected into [shellFooter]) ── */
      .folio-powered-footer {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 16px;
        font-size: 0.75rem;
        font-family: var(--font-mono);
        color: var(--text-muted);
        border-top: var(--border-width) solid var(--border);
      }

      .folio-powered-footer a {
        color: var(--text-accent);
        text-decoration: none;
      }

      .folio-powered-footer a:hover {
        text-decoration: underline;
      }
    `,
  ],
  providers: [
    {
      provide: SHELL_CONFIG,
      useFactory: () => inject(App).shellConfig,
    },
  ],
})
export class App implements OnInit {
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly firestore = inject(FIRESTORE);
  private readonly siteId =
    inject(SITE_ID, { optional: true }) ?? 'foliokitcms';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly billingRecord = signal<BillingRecord | null>(null);

  /**
   * Bare-route detection. Routes flagged `data.bareShell` (404 / wildcard) drive
   * `rhombus-app-shell [hasNav]="false"` — the nav drawer is omitted and content
   * spans full width, while the toolbar chrome is retained. Read from the deepest
   * activated route so the wildcard route is covered too. Route data is
   * deterministic per-URL, so this is SSR/hydration-safe (no platform guards).
   */
  private readonly bareShell = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) route = route.firstChild;
        return route.data?.['bareShell'] === true;
      }),
    ),
    { initialValue: false },
  );

  /** False on bare routes (404/wildcard); true for the standard blog chrome. */
  protected readonly hasNav = computed(() => !this.bareShell());

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
    const homeOn = config?.pages?.home?.enabled === true;
    const blogOn = isBlogPageNavEnabled(config);
    const aboutOn = config?.pages?.about?.enabled === true;
    const linksOn = config?.pages?.links?.enabled === true;

    const rawBase = DEFAULT_NAV;
    const base = rawBase.filter((item) => {
      if (item.url === '/' && !homeOn) return false;
      if (item.url === '/posts' && !blogOn) return false;
      if (item.url === '/about' && !aboutOn) return false;
      if (item.url === '/links' && !linksOn) return false;
      return true;
    });
    const extra: NavItem[] = [];
    if (homeOn) extra.push({ label: 'Home', url: '/' });
    if (blogOn) extra.push({ label: 'Blog', url: '/posts' });
    if (blogOn) extra.push({ label: 'Series', url: '/series' });
    if (aboutOn) extra.push({ label: 'About', url: '/about' });
    if (linksOn) extra.push({ label: 'Links', url: '/links' });
    const existingUrls = new Set(base.map((i) => i.url));
    return [...base, ...extra.filter((e) => !existingUrls.has(e.url))];
  });

  /** Blog nav items as a single nav-list section, matching the admin shell sidebar. */
  protected readonly navSections = computed<RhombusNavSection[]>(() => [
    {
      items: this.navItems().map((item) => ({
        label: item.label,
        routerLink: item.url,
        exact: true,
      })),
    },
  ]);

  readonly shellConfig = computed((): ShellConfig => {
    const config = this.siteConfig();
    const billing = this.billingRecord();
    const features = getPlanFeatures(billing?.plan ?? 'starter');
    return {
      appName: config?.siteName ?? 'FolioKit Blog',
      logoUrl: features.removeBranding ? (config?.logo ?? null) : null,
      showAuth: false,
      features,
      toolbarHomeRoute: '/',
    };
  });

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.firestore) return;
    try {
      const snap = await getDoc(doc(this.firestore, 'billing', this.siteId));
      if (snap.exists()) {
        this.billingRecord.set(snap.data() as BillingRecord);
      }
    } catch (e) {
      console.warn('[FolioKit] Failed to load billing record:', e);
    }
  }
}
