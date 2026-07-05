import { getDb } from '@titrra/db';
import { NextResponse } from 'next/server';
import { getUserId } from '@/app/api/_lib/device-user';
import { type BillingPeriod, modeForPeriod, priceIdFor } from '@/constants';
import { currencyForCountry } from '@/lib/currency';
import { siteUrl } from '@/lib/site';
import { getStripe, isStripeConfigured } from '@/lib/stripe';

const VALID_PERIODS: BillingPeriod[] = ['MONTHLY', 'ANNUAL', 'LIFETIME'];

// POST /api/checkout — create a Stripe Checkout Session for Titrra Pro. The
// anonymous device user is the identity: client_reference_id = User.id, so the
// webhook attaches the resulting subscription to the same DB user the mobile
// app and RevenueCat use. Returns { url } for the client to redirect to.
export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'no device' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { period?: string };
  const period = body.period as BillingPeriod | undefined;
  if (!period || !VALID_PERIODS.includes(period)) {
    return NextResponse.json({ error: 'invalid period' }, { status: 400 });
  }

  const priceId = priceIdFor(period);
  if (!isStripeConfigured() || !priceId) {
    return NextResponse.json(
      { error: 'billing not configured' },
      { status: 503 },
    );
  }

  const db = getDb();
  const user = await db.user.findUnique({ where: { id: userId } });
  const mode = modeForPeriod(period);

  // First-time subscribers get the 3-day trial on recurring plans.
  const existing = await db.subscription.findFirst({ where: { userId } });
  const trialDays = mode === 'subscription' && !existing ? 3 : undefined;

  // Present the visitor's local currency from the Price's currency_options. Can
  // only be set when there's no existing customer pinned to another currency.
  const country =
    req.headers.get('x-vercel-ip-country') ?? req.headers.get('x-country');
  const currency = currencyForCountry(country).toLowerCase();
  const canSetCurrency = !user?.stripeCustomerId;

  const session = await getStripe().checkout.sessions.create({
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: userId,
    customer: user?.stripeCustomerId ?? undefined,
    ...(canSetCurrency ? { currency } : {}),
    // Guest one-time payments: create a customer so the webhook can link it.
    ...(mode === 'payment' && !user?.stripeCustomerId
      ? { customer_creation: 'always' as const }
      : {}),
    ...(trialDays
      ? { subscription_data: { trial_period_days: trialDays } }
      : {}),
    allow_promotion_codes: true,
    success_url: siteUrl('/app?checkout=success'),
    cancel_url: siteUrl('/paywall?checkout=cancelled'),
  });

  return NextResponse.json({ url: session.url });
}
