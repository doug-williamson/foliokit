import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ColorScheme = 'light' | 'dark';

const STORAGE_KEY = 'folio-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly scheme = signal<ColorScheme>(this.resolveInitialScheme());

  toggle(): void {
    this.scheme.update((s) => (s === 'light' ? 'dark' : 'light'));
    this.apply();
  }

  apply(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const current = this.scheme();
    document.documentElement.setAttribute('data-theme', current);
    try {
      localStorage.setItem(STORAGE_KEY, current);
    } catch {
      // localStorage may be unavailable (private browsing, etc.)
    }
  }

  private resolveInitialScheme(): ColorScheme {
    if (!isPlatformBrowser(this.platformId)) return 'light';

    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ColorScheme | null;
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
