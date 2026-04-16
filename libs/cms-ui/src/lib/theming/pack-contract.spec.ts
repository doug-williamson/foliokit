import { describe, expect, it } from 'vitest';
import { EDITORIAL_PACK } from './built-in-packs/editorial.pack';
import { COMIC_BOOK_PACK } from './marketplace-preview/comic-book.pack';
import type { ThemePack } from './theme-pack.model';

/**
 * Contract guard: every registered theme pack must define the same set of
 * token keys across both color modes and across the whole registry. Missing
 * a key in one mode or one pack would silently inherit the previous pack's
 * value when swapped at runtime.
 */
describe('theme-pack contract', () => {
  const packs: ThemePack[] = [EDITORIAL_PACK, COMIC_BOOK_PACK];

  it('every pack defines matching light/dark key sets', () => {
    for (const pack of packs) {
      const lightKeys = Object.keys(pack.tokens.light).sort();
      const darkKeys = Object.keys(pack.tokens.dark).sort();
      expect(lightKeys, `${pack.id} light/dark key mismatch`).toEqual(darkKeys);
    }
  });

  it('all packs share the same token key set', () => {
    const baseline = new Set(Object.keys(packs[0].tokens.light));
    for (const pack of packs) {
      const lightKeys = new Set(Object.keys(pack.tokens.light));
      expect(lightKeys, `${pack.id} drifts from baseline keys`).toEqual(baseline);
    }
  });
});
