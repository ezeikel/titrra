import { getDb } from '@titrra/db';
import { jwtVerify, SignJWT } from 'jose';

// Mobile auth bridge (ported from chunky-crayon, adapted to Titrra's schema).
// The RN app can't hold a NextAuth cookie session, so we mint a signed device
// JWT here. proxy.ts verifies it and injects `x-user-id`. Anonymous-first: a
// device gets a User immediately; signing in with an email links/merges that
// anonymous user into the real account (see mergeAnonymousUserIntoTarget).

const JWT_SECRET = new TextEncoder().encode(
  process.env.MOBILE_AUTH_SECRET ||
    process.env.NEXT_AUTH_SECRET ||
    'dev-secret-change-me',
);

// Device tokens are device-bound, so a long expiry is fine.
const TOKEN_EXPIRATION = '365d';

export type MobileTokenPayload = {
  deviceId: string;
  userId?: string; // set once linked to a real (or anonymous) User
  type: 'device' | 'user';
};

export const createDeviceToken = async (
  deviceId: string,
  userId?: string,
): Promise<string> =>
  new SignJWT({
    deviceId,
    userId,
    type: userId ? 'user' : 'device',
  } as MobileTokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(JWT_SECRET);

export const verifyMobileToken = async (
  token: string,
): Promise<MobileTokenPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as MobileTokenPayload;
  } catch {
    return null;
  }
};

/**
 * Resolve (or create) the anonymous User for a device. Nesting the user create
 * inside the session upsert makes `deviceId @unique` gate creation atomically,
 * so two concurrent /register calls (cold-start race) don't orphan a User.
 */
export const getOrCreateDeviceUser = async (
  deviceId: string,
): Promise<{ userId: string; isNew: boolean }> => {
  const db = getDb();
  const existing = await db.mobileDeviceSession.findUnique({
    where: { deviceId },
    select: { userId: true },
  });
  if (existing) return { userId: existing.userId, isNew: false };

  const session = await db.mobileDeviceSession.upsert({
    where: { deviceId },
    update: {},
    create: {
      deviceId,
      user: { create: {} }, // anonymous User (email = null)
    },
    select: { userId: true },
  });
  return { userId: session.userId, isNew: true };
};

export const getDeviceUserId = async (
  deviceId: string,
): Promise<string | null> => {
  const db = getDb();
  const session = await db.mobileDeviceSession.findUnique({
    where: { deviceId },
    select: { userId: true },
  });
  return session?.userId ?? null;
};

/**
 * Extract identity from request headers. Supports Bearer (signed JWT) and
 * Device (raw device id, anonymous fallback). proxy.ts calls this, then injects
 * the resolved user id as `x-user-id`.
 */
export const getMobileAuthFromHeaders = async (
  headers: Headers,
): Promise<{ userId: string | null; deviceId: string | null }> => {
  const authHeader = headers.get('authorization');
  if (!authHeader) return { userId: null, deviceId: null };

  if (authHeader.startsWith('Bearer ')) {
    const payload = await verifyMobileToken(authHeader.slice(7));
    if (payload) {
      return { userId: payload.userId ?? null, deviceId: payload.deviceId };
    }
  }

  if (authHeader.startsWith('Device ')) {
    const deviceId = authHeader.slice(7);
    return { userId: await getDeviceUserId(deviceId), deviceId };
  }

  return { userId: null, deviceId: null };
};

/**
 * Merge an anonymous device-user's data into a real account, then delete the
 * anonymous user. Runs in a transaction. RULE: the ACCOUNT wins on conflict —
 * for IntakeLog (@@unique([userId, date])) the anon duplicate for an already-
 * logged date is dropped, not overwritten. Billing rows carry `@unique`
 * columns (externalId / stripeSubscriptionId / User.revenuecatUserId) so we
 * only move a subscription that doesn't collide, and never resurrect a
 * cancelled one over an active account sub.
 *
 * Mirrors chunky-crayon's mergeAnonymousUserIntoTarget, retargeted to Titrra's
 * medication tree + billing tables.
 */
export const mergeAnonymousUserIntoTarget = async (
  anonUserId: string,
  targetUserId: string,
): Promise<void> => {
  if (anonUserId === targetUserId) return;
  const db = getDb();

  await db.$transaction(async (tx) => {
    // 1. Reparent the medication tree + logs that have no per-user unique key.
    //    (TitrationStep / DoseLog follow medicationId, so moving Medication is
    //    enough for them.)
    await tx.medication.updateMany({
      where: { userId: anonUserId },
      data: { userId: targetUserId },
    });
    await tx.weightLog.updateMany({
      where: { userId: anonUserId },
      data: { userId: targetUserId },
    });
    await tx.sideEffectLog.updateMany({
      where: { userId: anonUserId },
      data: { userId: targetUserId },
    });
    await tx.reminder.updateMany({
      where: { userId: anonUserId },
      data: { userId: targetUserId },
    });
    await tx.subscriptionEvent.updateMany({
      where: { userId: anonUserId },
      data: { userId: targetUserId },
    });

    // 2. IntakeLog — account wins on [userId, date] collision. Move only the
    //    anon dates the account doesn't already have; delete the rest.
    const targetDates = new Set(
      (
        await tx.intakeLog.findMany({
          where: { userId: targetUserId },
          select: { date: true },
        })
      ).map((r) => r.date),
    );
    const anonIntake = await tx.intakeLog.findMany({
      where: { userId: anonUserId },
      select: { id: true, date: true },
    });
    const moveIds = anonIntake
      .filter((r) => !targetDates.has(r.date))
      .map((r) => r.id);
    const dropIds = anonIntake
      .filter((r) => targetDates.has(r.date))
      .map((r) => r.id);
    if (moveIds.length) {
      await tx.intakeLog.updateMany({
        where: { id: { in: moveIds } },
        data: { userId: targetUserId },
      });
    }
    if (dropIds.length) {
      await tx.intakeLog.deleteMany({ where: { id: { in: dropIds } } });
    }

    // 3. Subscriptions — move the anon user's subs to the account. The account
    //    is the surviving identity; keep any active sub it already has. Only
    //    reparent anon subs (their externalId/stripeSubscriptionId are already
    //    unique, so no collision). If the account has no active sub but the anon
    //    user did (bought Pro before signing in), this carries it over.
    await tx.subscription.updateMany({
      where: { userId: anonUserId },
      data: { userId: targetUserId },
    });

    // 4. Carry over billing linkage the account is missing (don't clobber).
    const [anon, target] = await Promise.all([
      tx.user.findUnique({
        where: { id: anonUserId },
        select: { stripeCustomerId: true, revenuecatUserId: true },
      }),
      tx.user.findUnique({
        where: { id: targetUserId },
        select: { stripeCustomerId: true, revenuecatUserId: true },
      }),
    ]);
    const carry: {
      stripeCustomerId?: string;
      revenuecatUserId?: string;
    } = {};
    if (!target?.stripeCustomerId && anon?.stripeCustomerId) {
      carry.stripeCustomerId = anon.stripeCustomerId;
    }
    // revenuecatUserId is @unique — only carry if the account doesn't have one
    // AND the anon value isn't already taken (it's the anon user's own id, so
    // it's free once we delete the anon user below).
    if (!target?.revenuecatUserId && anon?.revenuecatUserId) {
      carry.revenuecatUserId = anon.revenuecatUserId;
    }
    if (Object.keys(carry).length) {
      // Null out the anon user's unique fields first so the account can take
      // them without violating @unique, then delete the anon user.
      await tx.user.update({
        where: { id: anonUserId },
        data: { stripeCustomerId: null, revenuecatUserId: null },
      });
      await tx.user.update({ where: { id: targetUserId }, data: carry });
    }

    // 5. Delete the now-empty anonymous user + its device sessions (cascade).
    await tx.user.delete({ where: { id: anonUserId } });
  });
};

/**
 * The mobile OAuth/magic-link sign-in entry point. Given the device id and the
 * verified email (the RN app runs the native OAuth flow, then POSTs the email),
 * link/create/merge/switch the device to the right User and return a fresh
 * user-scoped token. Ported decision tree from chunky-crayon.
 */
export const handleMobileOAuthSignIn = async (
  deviceId: string,
  email: string,
  name?: string,
): Promise<{
  userId: string;
  token: string;
  isNewUser: boolean;
  wasMerged: boolean;
}> => {
  const db = getDb();
  const deviceSession = await db.mobileDeviceSession.findUnique({
    where: { deviceId },
    include: { user: true },
  });
  const existingUserWithEmail = await db.user.findUnique({ where: { email } });

  let finalUserId: string;
  let isNewUser = false;
  let wasMerged = false;

  if (!deviceSession) {
    // Device not registered yet.
    if (existingUserWithEmail) {
      finalUserId = existingUserWithEmail.id;
      await db.mobileDeviceSession.create({
        data: { deviceId, userId: finalUserId },
      });
    } else {
      const newUser = await db.user.create({
        data: { email, name: name ?? email.split('@')[0] },
      });
      finalUserId = newUser.id;
      isNewUser = true;
      await db.mobileDeviceSession.create({
        data: { deviceId, userId: finalUserId },
      });
    }
  } else {
    const currentUser = deviceSession.user;
    const isAnonymous = !currentUser.email;

    if (existingUserWithEmail) {
      if (existingUserWithEmail.id === currentUser.id) {
        // Already this user.
        finalUserId = currentUser.id;
      } else if (isAnonymous) {
        // Anonymous device signing into an existing account → merge.
        await mergeAnonymousUserIntoTarget(
          currentUser.id,
          existingUserWithEmail.id,
        );
        wasMerged = true;
        await db.mobileDeviceSession.create({
          data: { deviceId, userId: existingUserWithEmail.id },
        });
        finalUserId = existingUserWithEmail.id;
      } else {
        // A different authenticated user signs in on this device → switch.
        await db.mobileDeviceSession.update({
          where: { deviceId },
          data: { userId: existingUserWithEmail.id },
        });
        finalUserId = existingUserWithEmail.id;
      }
    } else if (isAnonymous) {
      // Promote the anonymous user to a real account (no merge needed).
      await db.user.update({
        where: { id: currentUser.id },
        data: { email, name: name ?? currentUser.name ?? email.split('@')[0] },
      });
      finalUserId = currentUser.id;
    } else {
      // Current user has a different email → create + switch.
      const newUser = await db.user.create({
        data: { email, name: name ?? email.split('@')[0] },
      });
      await db.mobileDeviceSession.update({
        where: { deviceId },
        data: { userId: newUser.id },
      });
      finalUserId = newUser.id;
      isNewUser = true;
    }
  }

  // Recreate the device session if the merge deleted it (merge cascades the
  // anon user's sessions). Guard with upsert so this is idempotent.
  await db.mobileDeviceSession.upsert({
    where: { deviceId },
    update: { userId: finalUserId, lastSeenAt: new Date() },
    create: { deviceId, userId: finalUserId },
  });

  const token = await createDeviceToken(deviceId, finalUserId);
  return { userId: finalUserId, token, isNewUser, wasMerged };
};
