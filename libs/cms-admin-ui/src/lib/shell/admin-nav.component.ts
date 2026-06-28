import {
  ChangeDetectionStrategy,
  Component,
  ViewContainerRef,
  computed,
  inject,
} from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import {
  RhombusNavListComponent,
  type RhombusNavItem,
  type RhombusNavSection,
} from '@rhombuskit/core';
import { isBlogPageNavEnabled, type SiteConfig } from '@foliokit/cms-core';
import type { AdminNavRow, NavItemState } from './admin-nav.types';
import { EnablePageSheetComponent, type EnablePageSheetData } from './enable-page-sheet.component';
import { PlanUpgradeNavSheetComponent } from './plan-upgrade-nav-sheet.component';
import type { EnablePageKey } from '../stores/site-config-nav.store';
import { SiteConfigNavStore } from '../stores/site-config-nav.store';

const ENABLE_PAGE_COPY: Record<
  EnablePageKey,
  { title: string; description: string }
> = {
  home: {
    title: 'Home',
    description: 'Your public landing page with hero, calls to action, and optional recent posts.',
  },
  blog: {
    title: 'Publish',
    description:
      'Posts and authors for your site — turn this on to manage publishing in the admin.',
  },
  about: {
    title: 'About',
    description: 'A dedicated about page with bio, photo, and social links for your visitors.',
  },
  links: {
    title: 'Links',
    description: 'A link-in-bio style page to highlight destinations you want visitors to open.',
  },
};

function isHomePageEnabled(config: SiteConfig | null): boolean {
  return config?.pages?.home?.enabled === true;
}

/**
 * Admin sidebar navigation. Renders through `<rhombus-nav-list>` (the app-shell
 * `[shellNav]` primitive): routed items self-highlight, and gated pages render as
 * `locked` items — focusable rows that, instead of navigating, open the
 * enable-page / plan-upgrade bottom sheets via `onDisabledTap`.
 */
@Component({
  selector: 'folio-admin-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'folio-admin-nav' },
  imports: [RhombusNavListComponent],
  styles: [
    `
      :host {
        display: block;
        padding: 16px 12px;
      }
    `,
  ],
  template: `
    <rhombus-nav-list ariaLabel="Admin" [sections]="navSections()" />
  `,
})
export class AdminNavComponent {
  private readonly navStore = inject(SiteConfigNavStore);
  private readonly bottomSheet = inject(MatBottomSheet);
  /**
   * Opened bottom sheets are created from this view container's injector so the
   * route-scoped {@link SiteConfigNavStore} (provided on AdminShellComponent) is
   * resolvable inside the sheet. Without it the CDK overlay falls back to the
   * root injector and the sheet throws NG0201.
   */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /** Rows for dashboard, Pages + children, Publish + children (Configure appended below). */
  protected readonly navRows = computed<AdminNavRow[]>(() => {
    const c = this.navStore.config();
    const homeOn = isHomePageEnabled(c);
    const aboutOn = c?.pages?.about?.enabled === true;
    const linksOn = c?.pages?.links?.enabled === true;
    const blogOn = isBlogPageNavEnabled(c);

    const rows: AdminNavRow[] = [
      {
        kind: 'item',
        id: 'dashboard',
        label: 'Dashboard',
        route: '/dashboard',
        icon: 'grid_view',
        enabled: true,
        pageLocked: false,
        planLocked: false,
      },
      { kind: 'header', id: 'hdr-pages', label: 'Pages' },
      {
        kind: 'item',
        id: 'page-config',
        label: 'Page Setup',
        route: '/pages',
        icon: 'web',
        enabled: true,
        pageLocked: false,
        planLocked: false,
      },
      {
        kind: 'item',
        id: 'page-home',
        label: 'Home',
        route: '/pages/home',
        icon: 'home',
        enabled: homeOn,
        pageLocked: !homeOn,
        planLocked: false,
        pageKey: 'home',
      },
      {
        kind: 'item',
        id: 'page-blog',
        label: 'Blog',
        route: '/pages/blog',
        icon: 'article',
        enabled: blogOn,
        pageLocked: !blogOn,
        planLocked: false,
        pageKey: 'blog',
      },
      {
        kind: 'item',
        id: 'page-about',
        label: 'About',
        route: '/pages/about',
        icon: 'info',
        enabled: aboutOn,
        pageLocked: !aboutOn,
        planLocked: false,
        pageKey: 'about',
      },
      {
        kind: 'item',
        id: 'page-links',
        label: 'Links',
        route: '/pages/links',
        icon: 'link',
        enabled: linksOn,
        pageLocked: !linksOn,
        planLocked: false,
        pageKey: 'links',
      },
      { kind: 'header', id: 'hdr-blog', label: 'Publish', muted: !blogOn },
      {
        kind: 'item',
        id: 'blog-posts',
        label: 'Posts',
        route: '/posts',
        icon: 'article',
        enabled: blogOn,
        pageLocked: !blogOn,
        planLocked: false,
        pageKey: 'blog',
      },
      {
        kind: 'item',
        id: 'blog-authors',
        label: 'Authors',
        route: '/authors',
        icon: 'people',
        enabled: blogOn,
        pageLocked: !blogOn,
        planLocked: false,
        pageKey: 'blog',
      },
      {
        kind: 'item',
        id: 'series',
        label: 'Series',
        route: '/series',
        icon: 'collections_bookmark',
        enabled: blogOn,
        pageLocked: !blogOn,
        planLocked: false,
        pageKey: 'blog',
      },
    ];
    return rows;
  });

  /** Group the flat rows into nav-list sections, then append the static Configure section. */
  protected readonly navSections = computed<RhombusNavSection[]>(() => {
    const sections: RhombusNavSection[] = [];
    let current: RhombusNavSection = { items: [] };
    sections.push(current);
    for (const row of this.navRows()) {
      if (row.kind === 'header') {
        current = { heading: row.label, items: [] };
        sections.push(current);
      } else {
        current.items.push(this.toNavItem(row));
      }
    }
    sections.push({
      heading: 'Configure',
      items: [{ label: 'Settings', icon: 'tune', routerLink: '/settings' }],
    });
    return sections.filter((s) => s.items.length > 0);
  });

  /**
   * Map an admin row to a nav-list item. Gated pages become `locked` items —
   * focusable rows that fire `action` instead of navigating, so the tap still
   * opens the enable-page / plan-upgrade sheet via `onDisabledTap`.
   */
  private toNavItem(row: NavItemState): RhombusNavItem {
    const badge =
      row.proTier === 'pro' ? 'PRO' : row.proTier ? 'AGENCY' : undefined;
    if (row.enabled) {
      return {
        label: row.label,
        icon: row.icon,
        routerLink: row.route,
        exact: row.id === 'dashboard' || row.id === 'page-config',
        ...(badge ? { badge } : {}),
      };
    }
    return {
      label: row.label,
      icon: row.icon,
      locked: true,
      action: () => this.onDisabledTap(row),
      ...(badge ? { badge } : {}),
    };
  }

  protected onDisabledTap(item: NavItemState): void {
    if (item.enabled) return;
    const preferPage = item.pageLocked && !item.planLocked;
    if (preferPage && item.pageKey) {
      const copy = ENABLE_PAGE_COPY[item.pageKey];
      const data: EnablePageSheetData = {
        page: item.pageKey,
        title: copy.title,
        description: copy.description,
      };
      this.bottomSheet.open(EnablePageSheetComponent, {
        data,
        viewContainerRef: this.viewContainerRef,
      });
      return;
    }
    if (item.planLocked) {
      this.bottomSheet.open(PlanUpgradeNavSheetComponent, {
        viewContainerRef: this.viewContainerRef,
      });
    }
  }
}
