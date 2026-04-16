export interface FontFaceSource {
  /** 'google' = inject <link> tag; 'face' = inject inline @font-face <style> block */
  readonly type: 'google' | 'face';
  /** For 'google': the full Google Fonts URL. For 'face': the @font-face CSS string. */
  readonly url: string;
}

export interface ThemePackTypography {
  readonly display: string;  // e.g. "'Fraunces', Georgia, serif"
  readonly body: string;     // e.g. "'Plus Jakarta Sans', system-ui, sans-serif"
  readonly mono: string;     // e.g. "'JetBrains Mono', 'Fira Code', monospace"
  /** Future: --fs-xs etc. overrides. Unused for now — include in type, leave unimplemented. */
  readonly scale?: Readonly<Record<string, string>>;
}

export interface ThemePack {
  readonly id: string;
  readonly name: string;
  /** Semver string e.g. '1.0.0' */
  readonly version: string;
  readonly author?: string;
  readonly description?: string;
  readonly preview?: {
    readonly light: string;
    readonly dark: string;
  };
  /** CSS custom property values for each color mode. Both 'light' and 'dark' are required. */
  readonly tokens: Readonly<Record<'light' | 'dark', Readonly<Record<string, string>>>>;
  /** Optional font declarations. Injected into <head> on pack activation. */
  readonly fonts?: readonly FontFaceSource[];
  /** Optional typography declarations. */
  readonly typography?: ThemePackTypography;
}
