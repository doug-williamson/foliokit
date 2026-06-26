import { getThemeInitScript } from '@rhombuskit/theme-engine';
import { FOLIOKIT_THEME_INIT_SCRIPT } from './theme-init-script';
import { FOLIOKIT_REGISTERED_THEMES } from './registered-themes';

const RHOMBUS_KEY = 'rhombuskit:theme-preference';
const LEGACY_KEY = 'folio-theme';

/** Strip the <script> wrapper and run the inline body in the current jsdom realm. */
function runInitScript(): void {
  const body = FOLIOKIT_THEME_INIT_SCRIPT.replace(/^<script>/, '').replace(/<\/script>$/, '');
  new Function(body)();
}

/** Mock prefers-color-scheme: dark to `matches`. */
function setSystemDark(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

describe('FOLIOKIT_THEME_INIT_SCRIPT', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    setSystemDark(false);
  });

  describe('resolution', () => {
    it('fresh load with OS light → data-theme="light", no key written', () => {
      runInitScript();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(localStorage.getItem(RHOMBUS_KEY)).toBeNull();
    });

    it('fresh load with OS dark → data-theme="dark", no key written', () => {
      setSystemDark(true);
      runInitScript();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem(RHOMBUS_KEY)).toBeNull();
    });

    it('explicit rhombus "system" preference resolves via prefers-color-scheme', () => {
      localStorage.setItem(RHOMBUS_KEY, 'system');
      setSystemDark(true);
      runInitScript();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('explicit rhombus "dark" preference wins over OS light', () => {
      localStorage.setItem(RHOMBUS_KEY, 'dark');
      runInitScript();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('legacy migration', () => {
    it('migrates folio-theme="dark" to the rhombus key and applies it pre-paint', () => {
      localStorage.setItem(LEGACY_KEY, 'dark');
      // OS is light: proves the carried-over preference (not the OS) drives the paint.
      runInitScript();
      expect(localStorage.getItem(RHOMBUS_KEY)).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('does not overwrite an existing rhombus preference', () => {
      localStorage.setItem(LEGACY_KEY, 'dark');
      localStorage.setItem(RHOMBUS_KEY, 'light');
      runInitScript();
      expect(localStorage.getItem(RHOMBUS_KEY)).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('ignores an unrecognized legacy value and falls back to system', () => {
      localStorage.setItem(LEGACY_KEY, 'true');
      runInitScript();
      expect(localStorage.getItem(RHOMBUS_KEY)).toBeNull();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('drift guard', () => {
    it('embeds the verbatim rhombus resolution body for the FolioKit config', () => {
      const body = getThemeInitScript(
        { light: 'light', dark: 'dark', default: 'system' },
        FOLIOKIT_REGISTERED_THEMES,
      )
        .replace(/^<script>/, '')
        .replace(/<\/script>$/, '');
      // If RhombusKit changes its resolution algorithm or storage key, or the registered
      // themes change, this fails — signaling that theme-init-script.ts AND the three
      // index.html must be re-synced from the package output.
      expect(FOLIOKIT_THEME_INIT_SCRIPT).toContain(body);
    });
  });
});
