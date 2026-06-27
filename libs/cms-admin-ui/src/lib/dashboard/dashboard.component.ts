import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService, BlogPost, PostService, SiteConfigService, PlanGatingService } from '@foliokit/cms-core';
import { RhombusButtonComponent, RhombusEmptyStateComponent, RhombusTagComponent } from '@rhombuskit/core';
import { SetupPromptComponent } from './setup-prompt.component';
import { SiteConfigNavStore } from '../stores/site-config-nav.store';

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
  agency_internal: 'Agency (Internal)',
};

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RhombusButtonComponent, RouterLink, SetupPromptComponent, RhombusEmptyStateComponent, RhombusTagComponent],
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

      /* Section A — Quick actions */
      .section-header {
        padding: 32px 32px 24px;
        border-bottom: var(--border-width) solid var(--border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
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
        border-bottom: var(--border-width) solid var(--border);
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
        padding: 4px 0;
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
        transition: background var(--motion-duration-fast) var(--motion-ease-standard);
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
        max-width: 480px;
        gap: 16px;
      }
      .health-tile {
        background: var(--surface-1);
        border: var(--border-width) solid var(--border);
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
      .tile-value--muted { color: var(--text-muted); }
      .tile-action {
        margin-top: 4px;
        align-self: flex-start;
        font-size: 12px;
        font-weight: 600;
        color: var(--mat-sys-on-primary);
        background: var(--text-accent);
        border: none;
        border-radius: 999px;
        padding: 8px 14px;
        cursor: pointer;
        font-family: var(--font-body);
        text-align: center;
        transition: filter var(--motion-duration-fast) var(--motion-ease-standard), transform var(--motion-duration-fast) var(--motion-ease-standard);
        &:hover {
          filter: brightness(1.05);
        }
      }
      .tile-clickable { cursor: pointer; }

      /* ── Tablet (768–1023) ── */
      @media (max-width: 1023.98px) {
        .section-header { padding: 24px 20px 20px; }
        .section-posts  { padding: 20px; }
        .section-health { padding: 20px; }
      }

      /* ── Mobile (<768) ── */
      @media (max-width: 767.98px) {
        .section-header         { padding: 16px 16px 14px; }
        .section-header button  { width: 100%; }
        .greeting               { font-size: 18px; }
        .section-posts          { padding: 16px; }
        .section-health         { padding: 16px; }
        .health-grid            { gap: 12px; }
      }
    `,
  ],
  template: `
    @if (showOnboarding()) {
      <admin-setup-prompt />
    } @else {
      <!-- Section A: Quick actions header -->
      <div class="section-header">
        <h1 class="greeting admin-page-title admin-page-title--greeting">{{ greeting() }}</h1>
        <rhombus-button (click)="navigateToNewPost()">New Post</rhombus-button>
      </div>

      <!-- Section B: Recent posts -->
      <div class="section-posts">
        <div class="section-title-row">
          <h2 class="section-title admin-section-label">Recent posts</h2>
          <a routerLink="/posts" class="view-all-link">View all →</a>
        </div>

        @if (allPosts() === undefined) {
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
          <rhombus-empty-state
            icon="edit"
            heading="No posts yet"
            body="Start writing — your first post is one click away."
            ctaLabel="New Post"
            (ctaClick)="navigateToNewPost()"
          />
        } @else {
          @for (post of recentFive(); track post.id) {
            <div
              class="post-row"
              role="button"
              tabindex="0"
              (click)="navigateToPost(post.id)"
              (keydown.enter)="navigateToPost(post.id)"
              (keydown.space)="$event.preventDefault(); navigateToPost(post.id)"
            >
              <div class="post-row-main">
                <span class="post-title">{{ post.title || '(Untitled)' }}</span>
                <span class="post-date admin-meta">{{ post.updatedAt | date:'MMM d' }}</span>
              </div>
              <rhombus-tag size="sm" [variant]="post.status">{{ badgeLabel(post) }}</rhombus-tag>
            </div>
          }
        }
      </div>

      <!-- GATE_TODO: analytics -->

      <!-- Section C: Site health strip -->
      <div class="section-health">
        <div class="health-grid">

          <!-- Published count -->
          <div class="health-tile">
            <span class="tile-label">Published</span>
            <span class="tile-value">{{ postCounts().published }}</span>
          </div>

          <!-- In Progress count (draft + scheduled) -->
          <div class="health-tile">
            <span class="tile-label">In Progress</span>
            <span class="tile-value">{{ postCounts().draft }}</span>
          </div>

          <!-- Archived count -->
          <div class="health-tile">
            <span class="tile-label">Archived</span>
            <span class="tile-value">{{ postCounts().archived }}</span>
          </div>

        </div>
      </div>
    }
  `,
})
export class DashboardComponent {
  private readonly postService = inject(PostService);
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly planGatingService = inject(PlanGatingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly siteConfigNavStore = inject(SiteConfigNavStore);

  readonly showOnboarding = computed(() => {
    if (!this.siteConfigNavStore.isLoaded()) return false;
    return !this.siteConfigNavStore.config()?.onboardingComplete;
  });

  readonly greeting = computed(() => {
    const name = this.auth.user()?.displayName;
    return name ? `${getGreeting()}, ${name}` : getGreeting();
  });

  readonly skeletonRows = [0, 1, 2];

  readonly allPosts = toSignal<BlogPost[]>(this.postService.getAllPosts());

  readonly siteConfig = toSignal(this.siteConfigService.getDefaultSiteConfig());

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

  badgeLabel(post: BlogPost): string {
    switch (post.status) {
      case 'published': return 'Published';
      case 'scheduled': return 'Scheduled';
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

}
