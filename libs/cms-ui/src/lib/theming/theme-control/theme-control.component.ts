import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RhombusThemeService } from '@rhombuskit/theme-engine';

// NOTE: the 'light'/'dark' ThemeRegistry augmentation (so setTheme('light'|'dark')
// type-checks) is provided program-wide by ./theme-registry, imported from
// foliokit-theme.providers.ts. We deliberately do NOT import it here: a side-effect
// import leaks into this component's emitted .d.ts, and consumers that build with
// ng-packagr (docs-ui) then choke loading the augmentation .d.ts
// ("Cannot destructure property 'pos' of file.referencedFiles[index]").

/**
 * The three mode choices this control offers. Distinct from preference()/current(), which
 * can now be a palette theme name (e.g. 'slate-dark') once the visitor picks a palette — this
 * control speaks only in light/dark/system and drives setMode(), which preserves the palette.
 */
type FolioThemePreference = 'light' | 'dark' | 'system';

/** Single-path glyphs, drawn with fill="currentColor". Sun/moon/monitor read as the
 *  user's PREFERENCE — monitor (system) is deliberately neither sun nor moon. */
const GLYPH_PATH: Record<FolioThemePreference, string> = {
  light:
    'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z',
  dark: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z',
  system:
    'M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h6v2H8v2h8v-2h-2v-2h6c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z',
};

const PREFERENCE_LABELS: Record<FolioThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

/**
 * Shared 3-state theme control: a compact icon-button menu (Light / Dark / System).
 *
 * The trigger glyph reflects the active MODE (sun / moon / monitor) — system-following reads
 * as "System", and a non-editorial palette (e.g. 'slate-dark') still reads as "Dark".
 * Items call RhombusThemeService.setMode() (not setTheme()/toggle()), so switching light↔dark
 * PRESERVES the active palette, every choice is reachable in one click, and `system`
 * (live OS-follow) stays accessible.
 *
 * Self-contained: inline currentColor SVGs (no Material icon font, no svgIcon registry),
 * so it renders identically in every shell — including admin, which ships no icon font.
 * Theming is inherited via Material tokens (e.g. --mat-menu-container-color from the
 * material-preset bridge); no bespoke colors here.
 */
@Component({
  selector: 'folio-theme-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatMenuModule],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="menu" [attr.aria-label]="triggerLabel()">
      <svg class="folio-theme-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path [attr.d]="glyphPath(activeMode())" />
      </svg>
    </button>

    <mat-menu #menu="matMenu">
      @for (opt of options; track opt.value) {
        <button
          mat-menu-item
          (click)="theme.setMode(opt.value)"
          [attr.aria-current]="activeMode() === opt.value ? 'true' : null"
        >
          <span
            class="folio-theme-item"
            [class.folio-theme-item--active]="activeMode() === opt.value"
          >
            <svg class="folio-theme-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path [attr.d]="glyphPath(opt.value)" />
            </svg>
            <span class="folio-theme-item-label">{{ opt.label }}</span>
          </span>
        </button>
      }
    </mat-menu>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .folio-theme-glyph {
        width: 24px;
        height: 24px;
        fill: currentColor;
      }
      .folio-theme-item {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
      }
      .folio-theme-item-label {
        flex: 1;
      }
      /* Active preference: tint glyph + label with the accent (RhombusKit theme-menu
         pattern). The glyph uses fill: currentColor, so colouring the row covers both. */
      .folio-theme-item--active {
        color: var(--text-accent);
      }
    `,
  ],
})
export class FolioThemeControlComponent {
  protected readonly theme = inject(RhombusThemeService);

  protected readonly options: ReadonlyArray<{ value: FolioThemePreference; label: string }> = [
    { value: 'light', label: PREFERENCE_LABELS.light },
    { value: 'dark', label: PREFERENCE_LABELS.dark },
    { value: 'system', label: PREFERENCE_LABELS.system },
  ];

  /** The mode the control reflects: 'system' when following the OS, else the resolved
   *  light/dark mode — so a palette theme name (e.g. 'slate-dark') still reads as "Dark". */
  protected readonly activeMode = computed<FolioThemePreference>(() =>
    this.theme.preference() === 'system' ? 'system' : this.theme.mode(),
  );

  protected readonly triggerLabel = computed(
    () => `Theme: ${PREFERENCE_LABELS[this.activeMode()]} — change theme`,
  );

  protected glyphPath(value: FolioThemePreference): string {
    return GLYPH_PATH[value];
  }
}
