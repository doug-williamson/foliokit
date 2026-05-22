const WORDS_PER_MINUTE = 225;

/**
 * Estimates how many minutes a post takes to read. Strips markdown syntax that
 * shouldn't count toward word totals (code fences, inline code, image/link
 * markup) then counts whitespace-delimited words. Always returns at least 1.
 */
export function computeReadingTimeMinutes(content: string): number {
  if (!content) return 1;

  const stripped = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~-]/g, ' ');

  const words = stripped.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
