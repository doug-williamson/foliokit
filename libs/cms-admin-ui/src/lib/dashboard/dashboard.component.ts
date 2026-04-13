import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  AuthService,
  BlogPost,
  isBlogPageNavEnabled,
  PlanGatingService,
  PostService,
  SiteConfig,
  SiteConfigService,
} from '@foliokit/cms-core';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Free',
  pro: 'Pro',
  agency: 'Agency',
};

@Component({
  selector: 'cms-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatIconModule],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 0;
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }

      /* Section A — Greeting header */
      .section-header {
        padding: 32px 32px 24px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
      }
      .greeting {
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }

      /* Section B — Recent posts */
      .section-posts {
        padding: 24px 32px;
        border-bottom: 1px solid var(--border);
      }
      .section-title-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }
      .section-title {
        font-family: var(--font-display);
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin: 0;
      }
      .view-all-link {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-accent);
        text-decoration: none;
        cursor: pointer;
        background: none;
        border: none;
        padding: 4px 0;
        font-family: var(--font-body);
        flex-shrink: 0;
        &:hover { text-decoration: underline; }
      }

      /* Post row */
      .post-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        border-radius: var(--r-sm);
        cursor: pointer;
        transition: background 0.12s;
        margin: 0 -12px;
        &:hover { background: var(--surface-2); }
      }
      .post-row-main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .post-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .post-date {
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--text-muted);
      }

      /* Skeleton rows */
      @keyframes folio-skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      .skeleton-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
      }
      .skeleton-bar {
        height: 16px;
        background: var(--surface-2);
        border-radius: 4px;
        animation: folio-skeleton-pulse 1.4s ease-in-out infinite;
      }

      /* Empty state */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 40px 0 24px;
        text-align: center;
      }
      .empty-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--text-muted);
      }
      .empty-heading {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
      .empty-sub {
        font-size: 14px;
        color: var(--text-muted);
        margin: 0;
      }

      /* Section C — Health strip */
      .section-health {
        padding: 24px 32px;
      }
      .health-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      .health-grid--cols-2 {
        grid-template-columns: repeat(2, 1fr);
      }
      .health-tile {
        background: var(--surface-1);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .tile-label {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-muted);
      }
      .tile-value {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.2;
      }
      .tile-value--teal { color: var(--teal-400); }
      .tile-value--secondary { color: var(--text-secondary); }
      .tile-value--nav {
        color: var(--text-accent);
        font-weight: 600;
      }
      .tile-upgrade {
        margin-top: 2px;
        align-self: flex-start;
        padding: 0;
        min-width: 0;
        line-height: 1.3;
        font-size: 13px;
        font-weight: 600;
      }
      .tile-clickable { cursor: pointer; }
      .health-tile.tile-clickable:hover {
        border-color: var(--text-accent);
        background: var(--surface-2);
      }

      /* ── Tablet (768–1023) ── */
      @media (max-width: 1023.98px) {
        .section-header { padding: 24px 20px 20px; }
        .section-posts  { padding: 20px; }
        .section-health { padding: 20px; }
      }

      /* ── Mobile (<768) ── */
      @media (max-width: 767.98px) {
        .section-header         { padding: 16px 16px 14px; }
        .greeting               { font-size: 18px; }
        .section-posts          { padding: 16px; }
        .section-health         { padding: 16px; }
        /* Stack tiles: Plan → Domain → Published so primary rows share one vertical rhythm */
        .health-grid,
        .health-grid--cols-2 {
          grid-template-columns: 1fr;
          gap: 10px;
        }
        .health-tile            { padding: 12px; }
        .tile-value             { font-size: 16px; }
      }
    `,
  ],
  template: `
    <!-- Section A: Greeting header -->
    <div class="section-header">
      <h1 class="greeting admin-page-title admin-page-title--greeting">{{ greeting() }}</h1>
    </div>

    <!-- Section B: Recent posts -->
    <div class="section-posts">
      @if (publishNavEnabled()) {
        <div class="section-title-row">
          <h2 class="section-title admin-section-label">Recent posts</h2>
          <button type="button" class="view-all-link" (click)="navigateToPosts()">View all</button>
        </div>
      }

      @if (!publishNavEnabled()) {
        <div class="empty-state">
          <mat-icon class="empty-icon" svgIcon="rocket_launch" />
          <p class="empty-heading">Your site is ready</p>
          <p class="empty-sub">Enable a page to go live, then start writing.</p>
          <button mat-flat-button color="primary" (click)="navigateToPages()">Enable Pages</button>
        </div>
      } @else if (allPosts() === undefined) {
        <!-- Skeleton loading state -->
        @for (i of skeletonRows; track i) {
          <div class="skeleton-row">
            <div class="skeleton-bar" style="flex:1;"></div>
            <div class="skeleton-bar" style="width:48px;"></div>
            <div class="skeleton-bar" style="width:36px;"></div>
          </div>
        }
      } @else if (recentFive().length === 0) {
        <!-- Empty state -->
        <div class="empty-state">
          <mat-icon class="empty-icon" svgIcon="edit" />
          <p class="empty-heading">No posts yet</p>
          <p class="empty-sub">Start writing — your first post is one click away.</p>
          <button mat-flat-button color="primary" (click)="navigateToNewPost()">New Post</button>
        </div>
      } @else {
        @for (post of recentFive(); track post.id) {
          <div class="post-row" (click)="navigateToPost(post.id)">
            <div class="post-row-main">
              <span class="post-title">{{ post.title || '(Untitled)' }}</span>
              <span class="post-date admin-meta">{{ post.updatedAt | date:'MMM d' }}</span>
            </div>
            <span [class]="badgeClass(post)">{{ badgeLabel(post) }}</span>
          </div>
        }
      }
    </div>

    <!-- GATE_TODO: analytics -->

    <!-- Section C: Site health strip -->
    <div class="section-health">
      <div
        class="health-grid"
        [class.health-grid--cols-2]="!publishNavEnabled()"
      >

        <!-- Tile 1: Plan -->
        <div class="health-tile">
          <span class="tile-label">Plan</span>
          <span
            class="tile-value"
            [class.tile-value--teal]="planTier() !== 'starter'"
            [class.tile-value--secondary]="planTier() === 'starter'"
          >{{ planLabel() }}</span>
          @if (planTier() === 'starter') {
            <a
              mat-button
              class="tile-upgrade"
              href="#"
              (click)="$event.preventDefault(); navigateToSettings()"
            >Upgrade →</a>
          }
        </div>

        <!-- Tile 2: Custom domain -->
        <div class="health-tile tile-clickable" (click)="navigateToSettings()">
          <span class="tile-label">Domain</span>
          @if (siteConfig()?.siteUrl) {
            <span class="tile-value" style="font-size:14px; word-break:break-all;">
              {{ siteConfig()!.siteUrl }}
            </span>
          } @else {
            <span class="tile-value tile-value--nav" style="font-size:14px;">Add custom domain →</span>
          }
        </div>

        @if (publishNavEnabled()) {
          <!-- Tile 3: Published count -->
          <div class="health-tile">
            <span class="tile-label">Published</span>
            <span class="tile-value">{{ postCounts().published }}</span>
          </div>
        }

      </div>
    </div>
  `,
})
export class DashboardComponent {
  private readonly postService = inject(PostService);
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly planGatingService = inject(PlanGatingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly greeting = computed(() => {
    const name = this.auth.user()?.displayName;
    return name ? `${getGreeting()}, ${name}` : getGreeting();
  });

  readonly skeletonRows = [0, 1, 2];

  readonly allPosts = toSignal<BlogPost[]>(this.postService.getAllPosts());

  readonly siteConfig = toSignal(this.siteConfigService.watchDefaultSiteConfig(), {
    initialValue: null as SiteConfig | null,
  });

  readonly publishNavEnabled = computed(() => isBlogPageNavEnabled(this.siteConfig()));

  readonly planTier = this.planGatingService.plan;

  readonly planLabel = computed(() => PLAN_LABELS[this.planTier()] ?? this.planTier());

  readonly recentFive = computed(() => (this.allPosts() ?? []).slice(0, 5));

  readonly postCounts = computed(() => {
    const posts = this.allPosts() ?? [];
    return {
      published: posts.filter((p) => p.status === 'published').length,
      draft: posts.filter((p) => p.status === 'draft' || p.status === 'scheduled').length,
      archived: posts.filter((p) => p.status === 'archived').length,
    };
  });

  badgeClass(post: BlogPost): string {
    switch (post.status) {
      case 'published': return 'badge badge-pub';
      case 'archived': return 'badge badge-arch';
      default: return 'badge badge-draft';
    }
  }

  badgeLabel(post: BlogPost): string {
    switch (post.status) {
      case 'published': return 'Published';
      case 'archived': return 'Archived';
      default: return 'Draft';
    }
  }

  navigateToNewPost(): void {
    this.router.navigate(['/posts/new']);
  }

  navigateToPost(postId: string): void {
    this.router.navigate(['/posts', postId, 'edit']);
  }

  navigateToPosts(): void {
    this.router.navigate(['/posts']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  navigateToPages(): void {
    this.router.navigate(['/pages']);
  }
}
