import { getDb } from '@titrra/db';
import { headers } from 'next/headers';
import type { BillingPeriod } from '@/constants';

// RevenueCat webhook: mobile IAPs → the same Subscription table Stripe writes,
// keyed on the same DB User.id (RC app_user_id === User.id, anchored via
// /api/me). This is the mobile half of the dual-billing source of truth.

type RcEvent = {
  event: {
    id: string;
    type: string;
    app_user_id: string;
    product_id?: string;
    purchased_at_ms?: number;
    expiration_at_ms?: number;
    period_type?: string; // TRIAL | NORMAL | INTRO
  };
};

// titrra_pro_monthly_v1 / _yearly_v1 / _lifetime_v1 → billing period.
const periodForProduct = (productId?: string): BillingPeriod | null => {
  if (!productId) return null;
  const id = productId.toLowerCase();
  if (id.includes('lifetime')) return 'LIFETIME';
  if (id.includes('yearly') || id.includes('annual')) return 'ANNUAL';
  if (id.includes('monthly')) return 'MONTHLY';
  return null;
};

const verifyAuth = async (): Promise<boolean> => {
  const auth = (await headers()).get('authorization');
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH_KEY;
  if (!expected) return true; // local dev convenience
  return auth === expected || auth === `Bearer ${expected}`;
};

const ms = (v?: number): Date | undefined => (v ? new Date(v) : undefined);

export async function POST(req: Request) {
  if (!(await verifyAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as RcEvent | null;
  const event = payload?.event;
  if (!event?.id) {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }
  if (event.type === 'TEST') {
    return Response.json({ received: true, test: true }, { status: 200 });
  }

  const db = getDb();

  // Idempotency.
  if (await db.webhookEvent.findUnique({ where: { id: event.id } })) {
    return Response.json({ received: true, skipped: true }, { status: 200 });
  }

  try {
    // Map app_user_id → DB user (it IS the User.id, anchored via /api/me).
    let user = await db.user.findFirst({
      where: {
        OR: [
          { id: event.app_user_id },
          { revenuecatUserId: event.app_user_id },
        ],
      },
    });

    if (!user && event.type === 'INITIAL_PURCHASE') {
      user = await db.user.create({
        data: {
          id: event.app_user_id,
          revenuecatUserId: event.app_user_id,
        },
      });
    } else if (user && !user.revenuecatUserId) {
      await db.user.update({
        where: { id: user.id },
        data: { revenuecatUserId: event.app_user_id },
      });
    }

    if (!user) {
      // Nothing to attach to — ack so RC stops retrying.
      await db.webhookEvent.create({
        data: { id: event.id, platform: 'REVENUECAT', eventType: event.type },
      });
      return Response.json({ received: true, noUser: true }, { status: 200 });
    }

    const period = periodForProduct(event.product_id);
    const isTrial = event.period_type === 'TRIAL';

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'NON_RENEWING_PURCHASE': {
        await db.subscription.upsert({
          where: { externalId: event.id },
          update: {},
          create: {
            userId: user.id,
            platform: 'REVENUECAT',
            externalId: event.id,
            billingPeriod: period ?? 'MONTHLY',
            status: isTrial ? 'TRIALING' : 'ACTIVE',
            currentPeriodStart: ms(event.purchased_at_ms),
            currentPeriodEnd: ms(event.expiration_at_ms),
            trialEnd: isTrial ? ms(event.expiration_at_ms) : undefined,
            storeProductId: event.product_id,
          },
        });
        await db.subscriptionEvent.create({
          data: {
            userId: user.id,
            platform: 'REVENUECAT',
            externalEventId: event.id,
            eventType: isTrial ? 'TRIAL_STARTED' : 'SUBSCRIPTION_STARTED',
            newStatus: isTrial ? 'TRIALING' : 'ACTIVE',
          },
        });
        break;
      }
      case 'RENEWAL': {
        await db.subscription.updateMany({
          where: { userId: user.id, platform: 'REVENUECAT' },
          data: {
            status: 'ACTIVE',
            currentPeriodEnd: ms(event.expiration_at_ms),
          },
        });
        break;
      }
      case 'CANCELLATION': {
        await db.subscription.updateMany({
          where: { userId: user.id, platform: 'REVENUECAT' },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
        break;
      }
      case 'UNCANCELLATION': {
        await db.subscription.updateMany({
          where: { userId: user.id, platform: 'REVENUECAT' },
          data: { status: 'ACTIVE', cancelledAt: null },
        });
        break;
      }
      case 'BILLING_ISSUE': {
        await db.subscription.updateMany({
          where: { userId: user.id, platform: 'REVENUECAT' },
          data: {
            status: 'PAST_DUE',
            gracePeriodEnd: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
          },
        });
        break;
      }
      case 'EXPIRATION': {
        await db.subscription.updateMany({
          where: { userId: user.id, platform: 'REVENUECAT' },
          data: { status: 'EXPIRED' },
        });
        break;
      }
      default:
        break;
    }

    await db.webhookEvent.create({
      data: { id: event.id, platform: 'REVENUECAT', eventType: event.type },
    });
    return Response.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error(`[revenuecat] handler failed for ${event.type}:`, err);
    return Response.json({ error: 'handler failed' }, { status: 500 });
  }
}
