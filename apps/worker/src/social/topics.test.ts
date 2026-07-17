import { describe, expect, it } from 'vitest';
import { pickSocialTheme, SOCIAL_THEMES } from './topics.js';

describe('SOCIAL_THEMES', () => {
  it('has unique keys', () => {
    const keys = SOCIAL_THEMES.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('pickSocialTheme', () => {
  it('returns the matching theme for an override substring', () => {
    const target = SOCIAL_THEMES[SOCIAL_THEMES.length - 1];
    expect(pickSocialTheme(target.key).key).toBe(target.key);
  });

  it('falls back to a valid theme when the override matches nothing', () => {
    expect(SOCIAL_THEMES).toContain(pickSocialTheme('nope-not-a-theme'));
  });

  it('always returns a theme from the fixed list', () => {
    expect(SOCIAL_THEMES).toContain(pickSocialTheme());
  });
});
