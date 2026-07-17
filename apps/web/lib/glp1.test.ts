import { buildLadder } from '@titrra/types';
import { describe, expect, it } from 'vitest';
import { DRUGS, getDrugMeta } from '@/lib/glp1';

describe('getDrugMeta', () => {
  it('returns the matching metadata for a known drug', () => {
    const meta = getDrugMeta('OZEMPIC');
    expect(meta.label).toBe('Ozempic');
    expect(meta.form).toBe('INJECTION');
    expect(meta.scheduleType).toBe('WEEKLY');
    expect(meta.doses).toContain(0.25);
  });

  it('marks Rybelsus as an oral, daily medication', () => {
    const meta = getDrugMeta('RYBELSUS');
    expect(meta.form).toBe('ORAL');
    expect(meta.scheduleType).toBe('DAILY');
  });

  it('falls back to the OTHER metadata for an unknown drug', () => {
    // @ts-expect-error — deliberately passing an invalid drug to test fallback.
    const meta = getDrugMeta('NOT_A_DRUG');
    expect(meta.drug).toBe('OTHER');
  });

  it('has ascending, positive dose rungs for every drug', () => {
    for (const d of DRUGS) {
      expect(d.doses.length).toBeGreaterThan(0);
      const sorted = [...d.doses].sort((a, b) => a - b);
      expect(d.doses).toEqual(sorted);
      expect(d.doses.every((mg) => mg > 0)).toBe(true);
    }
  });
});

// The onboarding ladder is built from a drug's metadata via the shared
// buildLadder — exercise the integration end-to-end for a real drug.
describe('drug metadata + ladder integration', () => {
  it('builds a Mounjaro ladder from current → goal', () => {
    const meta = getDrugMeta('MOUNJARO');
    expect(buildLadder(meta.doses, 2.5, 10)).toEqual([2.5, 5, 7.5, 10]);
  });
});
