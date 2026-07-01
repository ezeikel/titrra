import { getDb } from '@titrra/db';
import { NextResponse } from 'next/server';
import { mapStripeStatus } from '@/constants';
import { getStripe, isStripeConfigured } from '@/lib/stripe';

// Self-healing drift correction: re-pull live Stripe status for every
// non-terminal Stripe-linked subscription and rewrite disagreements. Driven by
// a Vercel cron (auth via CRON_SECRET). RC-only rows are out of scope (RC's own
// webhook keeps them current).
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({
      checked: 0,
      corrected: 0,
      skipped: 'no stripe',
    });
  }

  const db = getDb();
  const rows = await db.subscription.findMany({
    where: {
      platform: 'STRIPE',
      stripeSubscriptionId: { not: null },
      status: { notIn: ['EXPIRED', 'CANCELLED'] },
    },
  });

  let corrected = 0;
  for (const row of rows) {
    if (!row.stripeSubscriptionId) continue;
    try {
      const sub = await getStripe().subscriptions.retrieve(
        row.stripeSubscriptionId,
      );
      const status = mapStripeStatus(sub.status);
      if (status !== row.status) {
        await db.subscription.update({
          where: { id: row.id },
          data: { status },
        });
        corrected += 1;
      }
    } catch (err) {
      console.error(`[reconcile] ${row.stripeSubscriptionId} failed:`, err);
    }
  }

  return NextResponse.json({ checked: rows.length, corrected });
}
