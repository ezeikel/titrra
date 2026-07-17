import { describe, expect, it } from 'vitest';
import {
  INJECTION_SITES,
  type InjectionSite,
  isOverusingRegion,
  type RecentDose,
  SITE_LABELS,
  suggestNextSite,
} from './rotation';

// Build a most-recent-first history from a list of sites (index 0 = newest).
const history = (sites: (InjectionSite | null)[]): RecentDose[] =>
  sites.map((injectionSite, i) => ({
    injectionSite,
    // Each older entry is one day further back; exact times don't matter to the
    // logic (it ranks by ORDER, not timestamp), but keep them realistic.
    takenAt: new Date(2026, 0, 31 - i).toISOString(),
  }));

describe('suggestNextSite', () => {
  it('starts on the belly when nothing has been logged', () => {
    expect(suggestNextSite([])).toBe('ABDOMEN_L');
  });

  it('ignores oral (null-site) doses with no real injections', () => {
    expect(suggestNextSite(history([null, null]))).toBe('ABDOMEN_L');
  });

  it('never suggests the most recently used site', () => {
    const recent: InjectionSite = 'ABDOMEN_L';
    expect(suggestNextSite(history([recent]))).not.toBe(recent);
  });

  it('prefers a site that has never been used over a rested one', () => {
    // Used every site except ARM_R → it should be suggested first (rested = ∞).
    const used: InjectionSite[] = [
      'ABDOMEN_L',
      'ABDOMEN_R',
      'THIGH_L',
      'THIGH_R',
      'ARM_L',
    ];
    expect(suggestNextSite(history(used))).toBe('ARM_R');
  });

  it('suggests the longest-rested site once all have been used', () => {
    // Newest → oldest. The oldest used (last in the array) is the most rested.
    const used: InjectionSite[] = [
      'ARM_R', // most recent
      'ARM_L',
      'THIGH_R',
      'THIGH_L',
      'ABDOMEN_R',
      'ABDOMEN_L', // most rested
    ];
    expect(suggestNextSite(history(used))).toBe('ABDOMEN_L');
  });

  it('breaks ties toward a different body region than the last dose', () => {
    // Only the two abdomen sites have ever been used; the four limb sites are
    // all equally rested (∞). The tie-break should avoid the abdomen region
    // (last dose was abdomen) and never pick the just-used site.
    const suggestion = suggestNextSite(history(['ABDOMEN_L', 'ABDOMEN_R']));
    expect(['THIGH_L', 'THIGH_R', 'ARM_L', 'ARM_R']).toContain(suggestion);
  });

  it('always returns one of the six canonical sites', () => {
    const suggestion = suggestNextSite(history(['THIGH_L']));
    expect(INJECTION_SITES).toContain(suggestion);
  });
});

describe('isOverusingRegion', () => {
  it('is false with fewer than the window of doses', () => {
    expect(isOverusingRegion(history(['ABDOMEN_L', 'ABDOMEN_R']))).toBe(false);
  });

  it('flags three consecutive doses in the same region (across L/R)', () => {
    expect(
      isOverusingRegion(history(['ABDOMEN_L', 'ABDOMEN_R', 'ABDOMEN_L'])),
    ).toBe(true);
  });

  it('does not flag a spread-out rotation', () => {
    expect(isOverusingRegion(history(['ABDOMEN_L', 'THIGH_R', 'ARM_L']))).toBe(
      false,
    );
  });

  it('respects a custom window size', () => {
    const h = history(['THIGH_L', 'THIGH_R']);
    expect(isOverusingRegion(h, 2)).toBe(true);
    expect(isOverusingRegion(h, 3)).toBe(false);
  });

  it('ignores oral (null-site) doses when measuring overuse', () => {
    // Two abdomen injections with an oral dose interleaved still count the two
    // real injections — but that's only 2 real sites, under the window of 3.
    expect(isOverusingRegion(history(['ABDOMEN_L', null, 'ABDOMEN_R']))).toBe(
      false,
    );
  });
});

describe('SITE_LABELS', () => {
  it('has a human label for every canonical site', () => {
    for (const site of INJECTION_SITES) {
      expect(SITE_LABELS[site]).toBeTruthy();
    }
  });
});
