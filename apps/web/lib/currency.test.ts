import { describe, expect, it } from 'vitest';
import { currencyForCountry } from '@/lib/currency';

describe('currencyForCountry', () => {
  it('maps GB to GBP', () => {
    expect(currencyForCountry('GB')).toBe('GBP');
  });

  it('is case-insensitive (geo headers can vary)', () => {
    expect(currencyForCountry('gb')).toBe('GBP');
    expect(currencyForCountry('de')).toBe('EUR');
  });

  it('maps eurozone countries to EUR', () => {
    for (const c of ['DE', 'FR', 'IE', 'ES', 'NL']) {
      expect(currencyForCountry(c)).toBe('EUR');
    }
  });

  it('defaults non-eurozone, non-GB countries to USD', () => {
    expect(currencyForCountry('US')).toBe('USD');
    expect(currencyForCountry('AU')).toBe('USD');
    // EU member but not eurozone — must NOT show EUR.
    expect(currencyForCountry('SE')).toBe('USD');
  });

  it('defaults to USD when the geo header is missing', () => {
    expect(currencyForCountry(null)).toBe('USD');
    expect(currencyForCountry(undefined)).toBe('USD');
    expect(currencyForCountry('')).toBe('USD');
  });
});
