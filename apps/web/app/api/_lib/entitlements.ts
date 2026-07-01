import { getDb } from '@titrra/db';

export type Entitlements = {
  hasAccess: boolean;
  status:
    | 'TRIALING'
    | 'ACTIVE'
    | 'PAST_DUE'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'PAUSED'
    | 'INCOMPLETE'
    | 'UNPAID'
    | 'NONE';
  platform: 'STRIPE' | 'REVENUECAT' | null;
  billingPeriod: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | null;
  expiresAt: string | null;
  isTrialing: boolean;
  isCancelled: boolean;
};

const FREE: Entitlements = {
  hasAccess: false,
  status: 'NONE',
  platform: null,
  billingPeriod: null,
  expiresAt: null,
  isTrialing: false,
  isCancelled: false,
};

// Compute "is this user Pro right now?" from the Subscription rows — the DB is
// the source of truth (no denormalised flag). The most-recent active row wins:
// ACTIVE/TRIALING, or PAST_DUE within grace, or CANCELLED before period end, or
// a LIFETIME row (ACTIVE with no period end).
export async function getEntitlements(
  userId: string | null,
): Promise<Entitlements> {
  if (!userId) return FREE;
  const db = getDb();
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { subscriptions: { orderBy: { createdAt: 'desc' } } },
  });
  if (!user) return FREE;

  const now = new Date();
  const active = user.subscriptions.find(
    (s) =>
      s.status === 'ACTIVE' ||
      s.status === 'TRIALING' ||
      (s.status === 'PAST_DUE' &&
        s.gracePeriodEnd != null &&
        s.gracePeriodEnd > now) ||
      (s.status === 'CANCELLED' &&
        s.currentPeriodEnd != null &&
        s.currentPeriodEnd > now),
  );

  if (!active) return FREE;

  return {
    hasAccess: true,
    status: active.status,
    platform: active.platform,
    billingPeriod: active.billingPeriod,
    expiresAt: active.currentPeriodEnd?.toISOString() ?? null,
    isTrialing: active.status === 'TRIALING',
    isCancelled: active.cancelledAt != null,
  };
}
