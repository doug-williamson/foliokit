import { computeReadingTimeMinutes } from './compute-reading-time';

describe('computeReadingTimeMinutes', () => {
  it('returns 1 for empty content', () => {
    expect(computeReadingTimeMinutes('')).toBe(1);
  });

  it('returns 1 for content under one minute of reading', () => {
    const words = Array.from({ length: 100 }, () => 'word').join(' ');
    expect(computeReadingTimeMinutes(words)).toBe(1);
  });

  it('returns 2 for ~450 words', () => {
    const words = Array.from({ length: 450 }, () => 'word').join(' ');
    expect(computeReadingTimeMinutes(words)).toBe(2);
  });

  it('rounds up partial minutes', () => {
    const words = Array.from({ length: 250 }, () => 'word').join(' ');
    expect(computeReadingTimeMinutes(words)).toBe(2);
  });

  it('strips code fences and link/image markup before counting', () => {
    const content = [
      '```ts',
      Array.from({ length: 1000 }, () => 'codeword').join(' '),
      '```',
      '',
      '![alt text here](https://example.com/img.png)',
      '[click here](https://example.com)',
      Array.from({ length: 50 }, () => 'word').join(' '),
    ].join('\n');
    // ~52 words counted (50 + "click here"), well under 225 → 1 minute
    expect(computeReadingTimeMinutes(content)).toBe(1);
  });
});
