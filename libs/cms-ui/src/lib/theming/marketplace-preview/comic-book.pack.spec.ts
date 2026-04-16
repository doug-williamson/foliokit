import { describe, expect, it } from 'vitest';
import type { ThemePack } from '../theme-pack.model';
import { EDITORIAL_PACK } from '../built-in-packs/editorial.pack';
import { COMIC_BOOK_PACK } from './comic-book.pack';

describe('COMIC_BOOK_PACK', () => {
  it('conforms to ThemePack type', () => {
    const _pack: ThemePack = COMIC_BOOK_PACK;
    expect(_pack).toBeDefined();
  });

  it('has the expected id', () => {
    expect(COMIC_BOOK_PACK.id).toBe('comic-book');
  });

  it('light and dark modes define the same token keys', () => {
    const lightKeys = Object.keys(COMIC_BOOK_PACK.tokens.light).sort();
    const darkKeys = Object.keys(COMIC_BOOK_PACK.tokens.dark).sort();
    expect(lightKeys).toEqual(darkKeys);
  });

  it('covers every semantic token defined by the editorial pack', () => {
    const editorialLightKeys = Object.keys(EDITORIAL_PACK.tokens.light);
    const comicLightKeys = new Set(Object.keys(COMIC_BOOK_PACK.tokens.light));
    const comicDarkKeys = new Set(Object.keys(COMIC_BOOK_PACK.tokens.dark));
    for (const key of editorialLightKeys) {
      expect(comicLightKeys.has(key), `missing light token: ${key}`).toBe(true);
      expect(comicDarkKeys.has(key), `missing dark token: ${key}`).toBe(true);
    }
  });

  it('declares at least one font source with a valid URL', () => {
    const fonts = COMIC_BOOK_PACK.fonts;
    expect(fonts).toBeDefined();
    if (!fonts) return;
    expect(fonts.length).toBeGreaterThan(0);
    for (const font of fonts) {
      expect(() => new URL(font.url)).not.toThrow();
    }
  });
});
