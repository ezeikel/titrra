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
