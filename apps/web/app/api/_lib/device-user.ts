import { getDb } from '@titrra/db';

// Shared anonymous-device → user/medication resolution for the mobile API
// routes. v1 is anonymous-first: the client sends a stable device id in the
// `x-titrra-device` header, which we map to a User (keyed via a `device:`
// prefixed email so it can't collide with a real email later) plus their
// default Medication. TODO: harden into chunky-crayon's full session/register
// flow before launch.

export const DEVICE_HEADER = 'x-titrra-device';

export const getDeviceId = (req: Request): string | null => {
  const id = req.headers.get(DEVICE_HEADER)?.trim();
  return id && id.length > 0 ? id : null;
};

// Resolve (or create) the anonymous User for a device, WITHOUT the default
// medication side-effect. This is the identity bridge for billing: both the
// Stripe checkout (client_reference_id) and the RevenueCat webhook attach
// entitlement to this same User.id, and the mobile app sets RC's appUserID to
// it (via /api/me) so RC events reconcile with the DB user. No NextAuth needed.
export const resolveUser = async (deviceId: string) => {
  const db = getDb();
  const deviceEmail = `device:${deviceId}`;
  return db.user
    .upsert({
      where: { email: deviceEmail },
      update: {},
      create: { email: deviceEmail },
    })
    .catch(async (err) => {
      const code = (err as { code?: string })?.code;
      if (code === 'P2002') {
        return db.user.findUniqueOrThrow({ where: { email: deviceEmail } });
      }
      throw err;
    });
};

// The single server-side identity read all billing code flows through. Returns
// the DB User.id for the request's device, or null if no device header is
// present. (A NextAuth session branch would be added here later; for now the
// device id IS the identity.)
export const getUserId = async (req: Request): Promise<string | null> => {
  const deviceId = getDeviceId(req);
  if (!deviceId) return null;
  const user = await resolveUser(deviceId);
  return user.id;
};

export const resolveUserAndMedication = async (deviceId: string) => {
  const db = getDb();
  const deviceEmail = `device:${deviceId}`;

  // The Today screen fires several reads in parallel on first load, each of
  // which resolves the user — so concurrent upserts can race on the unique
  // `email` (both miss the row, both try to create). Catch the unique-violation
  // and re-read: whichever insert won, the row now exists.
  const user = await db.user
    .upsert({
      where: { email: deviceEmail },
      update: {},
      create: { email: deviceEmail },
    })
    .catch(async (err) => {
      const code = (err as { code?: string })?.code;
      if (code === 'P2002') {
        return db.user.findUniqueOrThrow({ where: { email: deviceEmail } });
      }
      throw err;
    });

  let medication = await db.medication.findFirst({
    where: { userId: user.id, active: true },
    orderBy: { createdAt: 'asc' },
  });

  // No medication set up yet → create a sensible default (a weekly GLP-1
  // injection) the user can edit later in onboarding.
  if (!medication) {
    medication = await db.medication.create({
      data: {
        userId: user.id,
        drug: 'OTHER',
        form: 'INJECTION',
        scheduleType: 'WEEKLY',
      },
    });
  }

  return { user, medication };
};
