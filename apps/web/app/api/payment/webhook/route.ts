import { getDb } from '@titrra/db';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { billingPeriodForPrice, mapStripeStatus } from '@/constants';
import { getStripe } from '@/lib/stripe';

// Idempotency — skip an event we've already processed (Stripe retries).
const isProcessed = async (eventId: string): Promise<boolean> => {
  const db = getDb();
  return !!(await db.stripeWebhookEvent.findUnique({ where: { id: eventId } }));
};
const markProcessed = async (eventId: string, type: string): Promise<void> => {
  const db = getDb();
  await db.stripeWebhookEvent.create({ data: { id: eventId, type } });
};

const periodDate = (ts: number | null | undefined): Date | undefined =>
  ts ? new Date(ts * 1000) : undefined;

// Resolve the DB user for a completed checkout: logged-in via
// client_reference_id, else guest via the Stripe customer's email.
const resolveUserForSession = async (
  session: Stripe.Checkout.Session,
): Promise<string | null> => {
  const db = getDb();
  if (session.client_reference_id) return session.client_reference_id;
  // Guest one-time payment — find/create a user from the customer email.
  const customerId =
    typeof session.customer === 'string' ? session.customer : null;
  if (!customerId) return null;
  const customer = await getStripe().customers.retrieve(customerId);
  const email = !customer.deleted ? customer.email : null;
  if (!email) return null;
  const user = await db.user.upsert({
    where: { email },
    update: { stripeCustomerId: customerId },
    create: { email, stripeCustomerId: customerId },
  });
  return user.id;
};

export async function POST(req: Request) {
  const body = await req.text(); // raw body for signature verification
  const signature = (await headers()).get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  if (secret) {
    // A secret is configured (production): a valid signature is REQUIRED.
    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }
    try {
      event = getStripe().webhooks.constructEvent(body, signature, secret);
    } catch (err) {
      console.error('[stripe] signature verification failed', err);
      return Response.json({ error: 'Bad request' }, { status: 400 });
    }
  } else {
    // Dev only (no secret configured) — trust the body.
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      return Response.json({ error: 'Bad request' }, { status: 400 });
    }
  }

  if (await isProcessed(event.id)) {
    return Response.json({ received: true, skipped: true }, { status: 200 });
  }

  const db = getDb();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = await resolveUserForSession(session);
        if (!userId) break;

        // Link the Stripe customer to the user if new.
        const customerId =
          typeof session.customer === 'string' ? session.customer : null;
        if (customerId) {
          await db.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId },
          });
        }

        if (session.mode === 'subscription' && session.subscription) {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          const sub = await getStripe().subscriptions.retrieve(subId);
          const priceId = sub.items.data[0]?.price.id;
          const period = billingPeriodForPrice(priceId);
          const item = sub.items.data[0];
          await db.subscription.upsert({
            where: { externalId: sub.id },
            update: {
              status: mapStripeStatus(sub.status),
              currentPeriodStart: periodDate(item?.current_period_start),
              currentPeriodEnd: periodDate(item?.current_period_end),
              trialStart: periodDate(sub.trial_start),
              trialEnd: periodDate(sub.trial_end),
            },
            create: {
              userId,
              platform: 'STRIPE',
              externalId: sub.id,
              stripeSubscriptionId: sub.id,
              billingPeriod: period ?? 'MONTHLY',
              status: mapStripeStatus(sub.status),
              currentPeriodStart: periodDate(item?.current_period_start),
              currentPeriodEnd: periodDate(item?.current_period_end),
              trialStart: periodDate(sub.trial_start),
              trialEnd: periodDate(sub.trial_end),
              storeProductId: priceId,
            },
          });
          await db.subscriptionEvent.create({
            data: {
              userId,
              platform: 'STRIPE',
              externalEventId: event.id,
              eventType: sub.trial_start
                ? 'TRIAL_STARTED'
                : 'SUBSCRIPTION_STARTED',
              newStatus: mapStripeStatus(sub.status),
              rawPayload: { subscriptionId: sub.id },
            },
          });
        } else if (session.mode === 'payment') {
          // Lifetime — one-time payment, no renewal. externalId = the session.
          await db.subscription.upsert({
            where: { externalId: session.id },
            update: { status: 'ACTIVE' },
            create: {
              userId,
              platform: 'STRIPE',
              externalId: session.id,
              billingPeriod: 'LIFETIME',
              status: 'ACTIVE',
            },
          });
          await db.subscriptionEvent.create({
            data: {
              userId,
              platform: 'STRIPE',
              externalEventId: event.id,
              eventType: 'SUBSCRIPTION_STARTED',
              newStatus: 'ACTIVE',
              rawPayload: { sessionId: session.id, lifetime: true },
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const item = sub.items.data[0];
        const period = billingPeriodForPrice(item?.price.id);
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: mapStripeStatus(sub.status),
            currentPeriodStart: periodDate(item?.current_period_start),
            currentPeriodEnd: periodDate(item?.current_period_end),
            trialEnd: periodDate(sub.trial_end),
            cancelledAt: sub.cancel_at_period_end ? new Date() : null,
            ...(period ? { billingPeriod: period } : {}),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
        const row = await db.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (row) {
          await db.subscriptionEvent.create({
            data: {
              userId: row.userId,
              subscriptionId: row.id,
              platform: 'STRIPE',
              externalEventId: event.id,
              eventType: 'CANCELLED',
              newStatus: 'CANCELLED',
            },
          });
        }
        break;
      }

      default:
        break;
    }

    await markProcessed(event.id, event.type);
    return Response.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error(`[stripe] handler failed for ${event.type}:`, err);
    return Response.json({ error: 'handler failed' }, { status: 500 });
  }
}
