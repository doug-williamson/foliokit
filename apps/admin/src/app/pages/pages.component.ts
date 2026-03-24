import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LinksPage, PageService, SiteConfig } from '@foliokit/cms-core';
import { SiteConfigEditorStore } from '@foliokit/cms-admin-ui';

interface FeatureCardConfig {
  flag: keyof NonNullable<SiteConfig['features']>;
  label: string;
  description: string;
  editRoute: string;
  liveUrl: (siteUrl: string) => string;
  hasContent: (config: SiteConfig, linksPage?: LinksPage | null) => boolean;
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
    @if (store.config()) {
      <div class="p-6">
        <h1 class="text-2xl font-semibold mb-2">Pages</h1>
        <p class="text-sm text-gray-500 mb-6">Enable or disable optional pages for your blog. Toggling saves immediately.</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          @for (card of cards; track card.flag) {
            @let cfg = store.config()!;
            @let state = cardState(card, cfg);
            @let enabled = cfg.features?.[card.flag] ?? false;
            @let liveUrl = cfg.siteUrl ? card.liveUrl(cfg.siteUrl) : null;

            <mat-card class="flex flex-col" [class.opacity-60]="state === 'disabled'">
              <mat-card-header class="flex items-start justify-between">
                <div>
                  <mat-card-title class="text-base font-semibold">{{ card.label }}</mat-card-title>
                  <mat-card-subtitle class="text-xs mt-1">{{ card.description }}</mat-card-subtitle>
                </div>
                <mat-slide-toggle
                  [checked]="enabled"
                  [disabled]="store.isSaving()"
                  (change)="toggle(card.flag, $event.checked)"
                  class="ml-4 mt-1"
                />
              </mat-card-header>

              <mat-card-content class="flex-1 mt-4">
                @switch (state) {
                  @case ('disabled') {
                    <span class="inline-flex items-center gap-1 text-xs text-gray-400 font-medium">
                      <mat-icon class="text-base leading-none" inline>block</mat-icon>
                      Not enabled
                    </span>
                  }
                  @case ('empty') {
                    <span class="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <mat-icon class="text-base leading-none" inline>warning</mat-icon>
                      Enabled — no content saved yet
                    </span>
                  }
                  @case ('published') {
                    <div class="flex flex-col gap-2">
                      <span class="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
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
                } @else {
                  <button mat-button color="primary" (click)="toggle(card.flag, true)" [disabled]="store.isSaving()">
                    Enable
                  </button>
                }
              </mat-card-actions>
            </mat-card>
          }
        </div>

        @if (store.saveError()) {
          <p class="mt-4 text-sm text-red-600">{{ store.saveError() }}</p>
        }
      </div>
    } @else {
      <div class="flex items-center justify-center h-64">
        <mat-spinner diameter="40" />
      </div>
    }
  `,
})
export class PagesComponent {
  protected readonly store = inject(SiteConfigEditorStore);
  private readonly router = inject(Router);
  private readonly pageService = inject(PageService);
  protected readonly linksPage = signal<LinksPage | null>(null);

  readonly cards: FeatureCardConfig[] = [
    {
      flag: 'aboutEnabled',
      label: 'About',
      description: 'A page introducing you or your brand to readers.',
      editRoute: '/about-page',
      liveUrl: (siteUrl) => `${siteUrl}/about`,
      hasContent: (cfg) => !!(cfg.pages?.about?.headline || cfg.pages?.about?.bio),
    },
    {
      flag: 'linksEnabled',
      label: 'Links',
      description: 'A curated links page for your social profiles and resources.',
      editRoute: '/links-page',
      liveUrl: (siteUrl) => `${siteUrl}/links`,
      hasContent: (_cfg, linksPage) => !!(linksPage?.links?.length),
    },
  ];

  constructor() {
    this.store.load();
    this.pageService.getPageById('links').subscribe((page) => {
      this.linksPage.set(page as LinksPage | null);
    });
  }

  protected cardState(card: FeatureCardConfig, config: SiteConfig): CardState {
    const enabled = config.features?.[card.flag] ?? false;
    if (!enabled) return 'disabled';
    const linksPage = card.flag === 'linksEnabled' ? this.linksPage() : null;
    return card.hasContent(config, linksPage) ? 'published' : 'empty';
  }

  protected toggle(flag: keyof NonNullable<SiteConfig['features']>, value: boolean): void {
    this.store.toggleFeature(flag, value);
  }

  protected navigate(route: string): void {
    this.router.navigate([route]);
  }
}
