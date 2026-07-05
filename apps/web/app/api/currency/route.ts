import { NextResponse } from 'next/server';
import { currencyForCountry } from '@/lib/currency';

// Returns the display currency for the visitor, from the edge geo header
// (Vercel sets x-vercel-ip-country). The paywall reads this to show local
// prices; the actual charge currency is decided by Stripe's multi-currency
// Price at checkout, so this is display-only.
export async function GET(req: Request) {
  const country =
    req.headers.get('x-vercel-ip-country') ??
    req.headers.get('x-country') ??
    null;
  return NextResponse.json({ currency: currencyForCountry(country) });
}
