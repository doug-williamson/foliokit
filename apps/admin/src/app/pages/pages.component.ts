import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SiteConfig } from '@foliokit/cms-core';
import { SiteConfigEditorStore } from '@foliokit/cms-admin-ui';

interface FeatureCardConfig {
  flag: 'about' | 'links';
  label: string;
  description: string;
  editRoute: string;
  liveUrl: (siteUrl: string) => string;
  hasContent: (config: SiteConfig) => boolean;
}

type CardState = 'disabled' | 'empty' | 'published';

@Component({
  selector: 'admin-pages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden">
      <div class="page-header">
        <div class="page-header-title">
          <h1 class="page-heading">Pages</h1>
        </div>
      </div>

      @if (store.config()) {
        <div class="page-content">
          <p class="text-sm mb-6" style="color: var(--text-muted)">Enable or disable optional pages for your blog. Toggling saves immediately.</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            @for (card of cards; track card.flag) {
              @let cfg = store.config()!;
              @let state = cardState(card, cfg);
              @let enabled = cfg.pages?.[card.flag]?.enabled ?? false;
              @let liveUrl = cfg.siteUrl ? card.liveUrl(cfg.siteUrl) : null;

              <mat-card class="flex flex-col" [class.opacity-60]="state === 'disabled'">
                <div class="flex items-start justify-between px-4 pt-4 pb-0 gap-3">
                  <div class="flex flex-col min-w-0">
                    <span class="text-base font-semibold leading-snug">{{ card.label }}</span>
                    <span class="text-xs mt-1 leading-snug" style="color: var(--text-muted)">{{ card.description }}</span>
                  </div>
                  <mat-slide-toggle
                    [checked]="enabled"
                    [disabled]="store.isSaving()"
                    (change)="toggle(card.flag, $event.checked)"
                    class="shrink-0 mt-0.5"
                  />
                </div>

                <mat-card-content class="flex-1 mt-4">
                  @switch (state) {
                    @case ('disabled') {
                      <span class="inline-flex items-center gap-1 text-xs font-medium" style="color: var(--text-disabled)">
                        <mat-icon class="text-base leading-none" inline>block</mat-icon>
                        Not enabled
                      </span>
                    }
                    @case ('empty') {
                      <span class="inline-flex items-center gap-1 text-xs font-medium" style="color: var(--warning)">
                        <mat-icon class="text-base leading-none" inline>warning</mat-icon>
                        Enabled — no content saved yet
                      </span>
                    }
                    @case ('published') {
                      <div class="flex flex-col gap-2">
                        <span class="inline-flex items-center gap-1 text-xs font-medium" style="color: var(--green-600)">
                          <mat-icon class="text-base leading-none" inline>check_circle</mat-icon>
                          Live
                        </span>
                        @if (liveUrl) {
                          <mat-chip-set>
                            <mat-chip>
                              <a [href]="liveUrl" target="_blank" rel="noopener" class="text-xs no-underline">
                                {{ liveUrl }}
                              </a>
                            </mat-chip>
                          </mat-chip-set>
                        }
                      </div>
                    }
                  }
                </mat-card-content>

                <mat-card-actions>
                  @if (state !== 'disabled') {
                    <button mat-button color="primary" (click)="navigate(card.editRoute)">
                      Edit page
                      <mat-icon iconPositionEnd>arrow_forward</mat-icon>
                    </button>
                  }
                </mat-card-actions>
              </mat-card>
            }
          </div>

          @if (store.saveError()) {
            <p class="mt-4 text-sm" style="color: var(--red-600)">{{ store.saveError() }}</p>
          }
        </div>
      } @else {
        <div class="flex items-center justify-center flex-1">
          <mat-spinner diameter="40" />
        </div>
      }
    </div>
  `,
})
export class PagesComponent {
  protected readonly store = inject(SiteConfigEditorStore);
  private readonly router = inject(Router);

  readonly cards: FeatureCardConfig[] = [
    {
      flag: 'about',
      label: 'About',
      description: 'A page introducing you or your brand to readers.',
      editRoute: '/about-page',
      liveUrl: (siteUrl) => `${siteUrl}/about`,
      hasContent: (cfg) => !!(cfg.pages?.about?.bio?.trim().length),
    },
    {
      flag: 'links',
      label: 'Links',
      description: 'A curated links page for your social profiles and resources.',
      editRoute: '/links-page',
      liveUrl: (siteUrl) => `${siteUrl}/links`,
      hasContent: (cfg) => (cfg.pages?.links?.links?.length ?? 0) > 0,
    },
  ];

  constructor() {
    this.store.load();
  }

  protected cardState(card: FeatureCardConfig, config: SiteConfig): CardState {
    const enabled = config.pages?.[card.flag]?.enabled ?? false;
    if (!enabled) return 'disabled';
    return card.hasContent(config) ? 'published' : 'empty';
  }

  protected toggle(flag: 'about' | 'links', value: boolean): void {
    this.store.togglePageEnabled(flag, value);
  }

  protected navigate(route: string): void {
    this.router.navigate([route]);
  }
}
