import { NextResponse } from 'next/server';
import { getUserId } from '@/app/api/_lib/device-user';

// Returns the DB User.id for the requesting device. The mobile app calls this
// once at boot and passes the id to RevenueCat's appUserID (Purchases.configure
// / logIn), so RC webhook events reconcile with the same anonymous DB user that
// Stripe web checkout attaches to. The identity bridge, one round-trip.
export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'no device' }, { status: 401 });
  }
  return NextResponse.json({ userId });
}
