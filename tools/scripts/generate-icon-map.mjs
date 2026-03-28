/**
 * One-time script to generate the inlined SVG icon map for cms-admin-ui.
 *
 * Reads filled-style SVGs from @material-design-icons/svg and writes a
 * TypeScript file with an object mapping icon name → SVG string.
 *
 * Usage:  node tools/scripts/generate-icon-map.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const SVG_DIR = resolve(ROOT, 'node_modules/@material-design-icons/svg/filled');
const OUT = resolve(ROOT, 'libs/cms-admin-ui/src/lib/icons/icon-svg-map.ts');

const ICONS = [
  'add', 'add_photo_alternate', 'arrow_back', 'arrow_forward', 'article',
  'auto_stories', 'block', 'business', 'cancel', 'check_circle',
  'check_circle_outline', 'chevron_right', 'cloud', 'code', 'dark_mode',
  'delete', 'drag_indicator', 'edit', 'edit_note', 'expand_less',
  'expand_more', 'home', 'info', 'language', 'light_mode', 'link',
  'live_tv', 'logout', 'mail', 'menu', 'music_note', 'open_in_new',
  'people', 'person', 'person_off', 'photo_camera', 'play_circle',
  'preview', 'publish', 'radio_button_unchecked', 'save', 'schedule',
  'settings', 'swap_horiz', 'tag', 'thumb_up', 'upload', 'upload_file',
  'warning',
].sort();

const entries = ICONS.map((name) => {
  const raw = readFileSync(resolve(SVG_DIR, `${name}.svg`), 'utf-8');
  // Strip comments, explicit width/height (let CSS size), add fill=currentColor
  const svg = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
    .replace(/ width="24" height="24"/, '')
    .replace('<svg ', '<svg fill="currentColor" ');
  return `  '${name}': '${svg.replace(/'/g, "\\'")}',`;
});

const ts = `/**
 * Auto-generated Material Icon SVG map.
 * Source: @material-design-icons/svg (filled)
 * Regenerate: node tools/scripts/generate-icon-map.mjs
 */
export const ICON_SVG_MAP: Record<string, string> = {
${entries.join('\n')}
};
`;

writeFileSync(OUT, ts, 'utf-8');
console.log(`Wrote ${ICONS.length} icons to ${OUT}`);
