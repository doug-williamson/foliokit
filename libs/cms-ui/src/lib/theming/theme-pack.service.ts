import {
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
import { SiteConfigService } from '@foliokit/cms-core';

/**
 * Manages FolioKit theme PACKS — bundles of fonts + typography. It is intentionally
 * colour-free.
 *
 * As of the @rhombuskit 1.6.0 palette adoption, every palette's COLOURS live in CSS
 * under `[data-theme="<name>"]` (libs/cms-ui/src/styles) and are switched by
 * RhombusThemeService.setPalette()/setMode() via the `data-theme` attribute. Applying
 * colours inline on <html> here (as a previous version did) would override that CSS by
 * specificity and break the Slate/Sandstone palettes — so this service no longer touches
 * colours. It owns the pack registry, font loading, and Firestore persistence of the
 * active pack id only. (A pack's `tokens` are retained on the model for backwards
 * compatibility but are no longer applied.)
 */
@Injectable({ providedIn: 'root' })
export class ThemePackService {
  // ── injected ──────────────────────────────────────────────────────────────
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
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
  /** Tracks font URLs/ids already injected to prevent duplicates. */
  private readonly loadedFonts = new Set<string>();

  constructor() {
    // Load editorial fonts immediately. Colours come from CSS [data-theme], not from here.
    this.loadFonts(EDITORIAL_PACK);

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
