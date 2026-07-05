import type { DisplayCurrency } from '@/constants';

// Eurozone country codes → EUR. Everything else falls back to USD unless it's
// GB (→ GBP). Kept minimal on purpose; the actual charge currency is decided by
// Stripe from the multi-currency Price, so this only drives the display.
const EUR_COUNTRIES = new Set([
  'AT',
  'BE',
  'HR',
  'CY',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PT',
  'SK',
  'SI',
  'ES',
]);

// Map a 2-letter country code (from the Vercel/edge geo header) to the display
// currency. Defaults to USD (the primary market).
export const currencyForCountry = (
  country: string | null | undefined,
): DisplayCurrency => {
  if (!country) return 'USD';
  const c = country.toUpperCase();
  if (c === 'GB') return 'GBP';
  if (EUR_COUNTRIES.has(c)) return 'EUR';
  return 'USD';
};
