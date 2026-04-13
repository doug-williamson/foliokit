import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
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

@Component({
  selector: 'folio-admin-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'folio-admin-nav' },
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  styles: [
    `
      @media (max-width: 959.98px) {
        :host ::ng-deep .nav-item,
        :host ::ng-deep .nav-item.nav-child {
          min-height: 48px;
        }
      }
      :host ::ng-deep .folio-admin-nav__hint-icon {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
        margin-inline-start: 4px;
        opacity: 0.75;
      }
    `,
  ],
  template: `
    @for (row of navRows(); track row.id) {
      @switch (row.kind) {
        @case ('header') {
          <span
            class="nav-group-label"
            [class.nav-group-label--disabled]="row.muted === true"
            >{{ row.label }}</span
          >
        }
        @case ('item') {
          @if (row.enabled) {
            <a
              class="nav-item"
              [class.nav-child]="row.id.startsWith('page-')"
              [routerLink]="row.route"
              routerLinkActive="active-link"
              [routerLinkActiveOptions]="rlaOpts(row)"
            >
              <mat-icon class="nav-icon" [svgIcon]="row.icon" />
              <span class="nav-label">{{ row.label }}</span>
              @if (row.proTier === 'pro') {
                <span class="nav-plan-badge nav-plan-badge--pro">PRO</span>
              }
            </a>
          } @else {
            <button
              type="button"
              class="nav-item nav-item--disabled"
              [class.nav-child]="row.id.startsWith('page-')"
              [attr.aria-disabled]="true"
              (click)="onDisabledTap(row)"
            >
              <mat-icon class="nav-icon" [svgIcon]="row.icon" />
              <span class="nav-label">{{ row.label }}</span>
              @if (row.proTier === 'pro') {
                <span class="nav-plan-badge nav-plan-badge--pro">PRO</span>
              }
              @if (row.showPageBeforePlanHint) {
                <mat-icon
                  class="folio-admin-nav__hint-icon"
                  svgIcon="info"
                  matTooltip="Enable Publish first — plan upgrade alone will not unlock this until the section is on."
                  matTooltipPosition="right"
                />
              }
            </button>
          }
        }
      }
    }

    <span class="nav-group-label">Configure</span>
    <a class="nav-item" routerLink="/settings" routerLinkActive="active-link">
      <mat-icon class="nav-icon" svgIcon="tune" />
      <span class="nav-label">Settings</span>
    </a>
  `,
})
export class AdminNavComponent {
  private readonly navStore = inject(SiteConfigNavStore);
  private readonly bottomSheet = inject(MatBottomSheet);

  /** Rows for dashboard, Pages + children, Publish + children (Configure appended in template). */
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
        icon: 'home',
        enabled: true,
        pageLocked: false,
        planLocked: false,
      },
      { kind: 'header', id: 'hdr-pages', label: 'Pages' },
      {
        kind: 'item',
        id: 'page-config',
        label: 'Configuration',
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
    ];
    return rows;
  });

  protected rlaOpts(row: NavItemState): { exact: boolean } {
    return { exact: row.id === 'dashboard' || row.id === 'page-config' };
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
      this.bottomSheet.open(EnablePageSheetComponent, { data });
      return;
    }
    if (item.planLocked) {
      this.bottomSheet.open(PlanUpgradeNavSheetComponent);
    }
  }
}
