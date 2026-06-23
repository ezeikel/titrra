import { describe, expect, it } from 'vitest';
import { buildLadder } from './titration';

// Mounjaro / tirzepatide rungs — a representative ladder.
const MOUNJARO = [2.5, 5, 7.5, 10, 12.5, 15];
// Ozempic / semaglutide — fractional rungs.
const OZEMPIC = [0.25, 0.5, 1, 2];

describe('buildLadder', () => {
  it('returns current → goal inclusive', () => {
    expect(buildLadder(MOUNJARO, 2.5, 10)).toEqual([2.5, 5, 7.5, 10]);
  });

  it('runs current → top of the list when no goal is set', () => {
    expect(buildLadder(MOUNJARO, 7.5)).toEqual([7.5, 10, 12.5, 15]);
  });

  it('runs current → top when goal is null', () => {
    expect(buildLadder(MOUNJARO, 5, null)).toEqual([5, 7.5, 10, 12.5, 15]);
  });

  it('returns a single rung when current equals goal', () => {
    expect(buildLadder(MOUNJARO, 10, 10)).toEqual([10]);
  });

  it('includes a non-standard current dose, sorted into place', () => {
    // A user on 3mg (not a standard Mounjaro rung) aiming for 10.
    expect(buildLadder(MOUNJARO, 3, 10)).toEqual([3, 5, 7.5, 10]);
  });

  it('includes a non-standard current dose with no goal', () => {
    expect(buildLadder(OZEMPIC, 0.75)).toEqual([0.75, 1, 2]);
  });

  it('works with fractional rungs', () => {
    expect(buildLadder(OZEMPIC, 0.25, 1)).toEqual([0.25, 0.5, 1]);
  });

  it('always includes the current dose even when below every rung', () => {
    const ladder = buildLadder(MOUNJARO, 1, 5);
    expect(ladder[0]).toBe(1);
    expect(ladder).toContain(5);
  });

  it('never returns a rung above the goal', () => {
    const ladder = buildLadder(MOUNJARO, 2.5, 7.5);
    expect(Math.max(...ladder)).toBe(7.5);
  });

  it('returns ascending order', () => {
    const ladder = buildLadder(MOUNJARO, 3, 12.5);
    const sorted = [...ladder].sort((a, b) => a - b);
    expect(ladder).toEqual(sorted);
  });
});
