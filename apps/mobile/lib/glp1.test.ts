import { buildLadder } from '@titrra/types';
import { describe, expect, it } from 'vitest';
import { DRUGS, getDrugMeta } from './glp1';

// Mobile keeps its own copy of the drug metadata (web has a sibling copy in
// apps/web/lib/glp1.ts) — these tests pin the invariants the onboarding smart
// defaults rely on.
describe('getDrugMeta', () => {
  it('returns the matching metadata for a known drug', () => {
    const meta = getDrugMeta('MOUNJARO');
    expect(meta.label).toBe('Mounjaro');
    expect(meta.form).toBe('INJECTION');
    expect(meta.scheduleType).toBe('WEEKLY');
    expect(meta.doses).toContain(2.5);
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

describe('drug metadata + ladder integration', () => {
  it('builds a Wegovy ladder from current → goal', () => {
    const meta = getDrugMeta('WEGOVY');
    expect(buildLadder(meta.doses, 0.25, 1.7)).toEqual([0.25, 0.5, 1, 1.7]);
  });
});
