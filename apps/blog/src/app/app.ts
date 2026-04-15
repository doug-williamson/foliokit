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
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { doc, getDoc } from 'firebase/firestore';
import { concat, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import type { SiteConfig } from '@foliokit/cms-core';

interface NavItem { label: string; url: string; }
import {
  FIRESTORE,
  SITE_ID,
  SiteConfigService,
  getPlanFeatures,
  isBlogPageNavEnabled,
} from '@foliokit/cms-core';
import type { BillingRecord } from '@foliokit/cms-core';
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
      useFactory: () => inject(App).shellConfig,
    },
  ],
})
export class App implements OnInit {
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly firestore = inject(FIRESTORE);
  private readonly siteId = inject(SITE_ID, { optional: true }) ?? 'foliokitcms';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly billingRecord = signal<BillingRecord | null>(null);

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
    const homeOn  = config?.pages?.home?.enabled === true;
    const blogOn  = isBlogPageNavEnabled(config);
    const aboutOn = config?.pages?.about?.enabled === true;
    const linksOn = config?.pages?.links?.enabled === true;

    const rawBase = DEFAULT_NAV;
    const base = rawBase.filter((item) => {
      if (item.url === '/'      && !homeOn)  return false;
      if (item.url === '/posts' && !blogOn)  return false;
      if (item.url === '/about' && !aboutOn) return false;
      if (item.url === '/links' && !linksOn) return false;
      return true;
    });
    const extra: NavItem[] = [];
    if (homeOn)  extra.push({ label: 'Home',   url: '/'       });
    if (blogOn)  extra.push({ label: 'Blog',   url: '/posts'  });
    if (blogOn)  extra.push({ label: 'Series', url: '/series' });
    if (aboutOn) extra.push({ label: 'About',  url: '/about'  });
    if (linksOn) extra.push({ label: 'Links',  url: '/links'  });
    const existingUrls = new Set(base.map((i) => i.url));
    return [...base, ...extra.filter((e) => !existingUrls.has(e.url))];
  });

  readonly shellConfig = computed((): ShellConfig => {
    const config = this.siteConfig();
    const billing = this.billingRecord();
    const features = getPlanFeatures(billing?.plan ?? 'starter');
    return {
      appName: config?.siteName ?? 'FolioKit Blog',
      logoUrl: features.removeBranding ? config?.logo : undefined,
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
