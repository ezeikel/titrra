import { NextResponse } from 'next/server';
import { getUserId } from '@/app/api/_lib/device-user';
import { getEntitlements } from '@/app/api/_lib/entitlements';

// GET /api/entitlements — the DB source of truth for "is this device Pro?".
// Both the web paywall and the mobile app read this (rather than trusting
// RevenueCat's customerInfo, which only knows store purchases and would miss a
// Stripe web subscription).
export async function GET(req: Request) {
  const userId = await getUserId(req);
  const entitlements = await getEntitlements(userId);
  return NextResponse.json(entitlements);
}
