import {
  computed,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { take } from 'rxjs/operators';
import { ThemePack } from './theme-pack.model';
import { FOLIOKIT_THEME_PACKS } from './theme-pack.tokens';
import { EDITORIAL_PACK } from './built-in-packs';
import { ThemeService } from '../theme.service';
import { SiteConfigService } from '@foliokit/cms-core';

@Injectable({ providedIn: 'root' })
export class ThemePackService {
  // ── injected ──────────────────────────────────────────────────────────────
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly themeService = inject(ThemeService);
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly injectedPacks =
    inject(FOLIOKIT_THEME_PACKS, { optional: true }) as ReadonlyArray<ReadonlyArray<ThemePack>> | null;

  // ── pack registry ─────────────────────────────────────────────────────────
  /** All available packs: editorial baseline + any registered via provideThemePacks. */
  private readonly allPacks: ReadonlyArray<ThemePack> = [
    EDITORIAL_PACK,
    ...((this.injectedPacks ?? []).flat()),
  ];

  // ── public signals ────────────────────────────────────────────────────────
  private readonly _activePack: WritableSignal<ThemePack> = signal(EDITORIAL_PACK);
  readonly activePack: Signal<ThemePack> = this._activePack.asReadonly();
  readonly availablePacks: Signal<ReadonlyArray<ThemePack>> = signal(this.allPacks).asReadonly();

  // ── private state ─────────────────────────────────────────────────────────
  /** Tracks which CSS property keys the current pack applied so they can be cleared on pack change. */
  private readonly appliedKeys = new Set<string>();
  /** Tracks font URLs/ids already injected to prevent duplicates. */
  private readonly loadedFonts = new Set<string>();

  constructor() {
    // Apply editorial tokens immediately as the default (before Firestore resolves).
    this.applyTokens();
    // Load editorial fonts immediately.
    this.loadFonts(EDITORIAL_PACK);

    // Re-apply tokens whenever the color mode changes.
    effect(() => {
      this.themeService.scheme(); // tracked — triggers when mode changes
      this.applyTokens();
    });

    // Resolve saved pack from SiteConfig on first load.
    this.siteConfigService
      .getDefaultSiteConfig()
      .pipe(take(1))
      .subscribe((config) => {
        if (config?.themePackId) {
          this.setPackById(config.themePackId, { persist: false });
        }
      });
  }

  // ── public API ────────────────────────────────────────────────────────────

  setPack(pack: ThemePack, options?: { persist?: boolean }): void {
    this._activePack.set(pack);
    this.applyTokens();
    this.loadFonts(pack);

    if (options?.persist !== false) {
      this.persistPack(pack.id);
    }
  }

  setPackById(id: string, options?: { persist?: boolean }): void {
    const pack = this.allPacks.find((p) => p.id === id);
    if (!pack) {
      console.warn('[ThemePackService] Unknown pack id:', id);
      return;
    }
    this.setPack(pack, options);
  }

  // ── private helpers ───────────────────────────────────────────────────────

  private applyTokens(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const mode = this.themeService.scheme();
    const tokens = this.activePack().tokens[mode];
    const root = this.document.documentElement;

    // Clear previously-applied keys before applying new pack.
    for (const key of this.appliedKeys) {
      root.style.removeProperty(key);
    }
    this.appliedKeys.clear();

    // Apply new tokens.
    for (const [key, value] of Object.entries(tokens)) {
      root.style.setProperty(key, value);
      this.appliedKeys.add(key);
    }
  }

  private loadFonts(pack: ThemePack): void {
    if (!isPlatformBrowser(this.platformId)) return;

    for (const font of pack.fonts ?? []) {
      if (this.loadedFonts.has(font.url)) continue;

      if (font.type === 'google') {
        const link = this.document.createElement('link');
        link.rel = 'stylesheet';
        link.href = font.url;
        this.document.head.appendChild(link);
      } else if (font.type === 'face') {
        const style = this.document.createElement('style');
        style.textContent = font.url; // font.url holds the @font-face CSS string for 'face' type
        this.document.head.appendChild(style);
      }

      this.loadedFonts.add(font.url);
    }
  }

  private persistPack(id: string): void {
    this.siteConfigService
      .getDefaultSiteConfig()
      .pipe(take(1))
      .subscribe({
        next: (config) => {
          if (!config) return;
          this.siteConfigService
            .saveSiteConfig({ ...config, themePackId: id })
            .subscribe({
              error: (err) => console.error('[ThemePackService] Failed to persist theme pack:', err),
            });
        },
        error: (err) => console.error('[ThemePackService] Failed to read config for persist:', err),
      });
  }
}
