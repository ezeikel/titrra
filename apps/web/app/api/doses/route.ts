import { getDb, type InjectionSite, isDatabaseConfigured } from '@titrra/db';
import { NextResponse } from 'next/server';

// Doses API — the first persistence path for the mobile Today screen.
// Mobile (RN) can't import Prisma directly, so it POSTs/GETs here and this
// route talks to @titrra/db → Neon. Auth is anonymous-first for v1: the client
// sends a stable device id in `x-titrra-device`, which we map to a User. This
// is the minimal version of chunky-crayon's mobile device-register flow; TODO
// harden into proper sessions before launch.

const DEVICE_HEADER = 'x-titrra-device';

const VALID_SITES = new Set<InjectionSite>([
  'ABDOMEN_L',
  'ABDOMEN_R',
  'THIGH_L',
  'THIGH_R',
  'ARM_L',
  'ARM_R',
]);

// Resolve (or lazily create) the anonymous user + their default medication for
// a device. Keyed off the device id so a user keeps their history with no login.
const resolveUserAndMedication = async (deviceId: string) => {
  const db = getDb();
  // The device id is stable per install; we store it in the (otherwise unused)
  // email slot prefixed so it can't collide with a real email later.
  const deviceEmail = `device:${deviceId}`;

  const user = await db.user.upsert({
    where: { email: deviceEmail },
    update: {},
    create: { email: deviceEmail },
  });

  let medication = await db.medication.findFirst({
    where: { userId: user.id, active: true },
    orderBy: { createdAt: 'asc' },
  });

  // No medication set up yet → create a sensible default the user can edit
  // later in onboarding (a weekly GLP-1 injection).
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

const getDeviceId = (req: Request): string | null => {
  const id = req.headers.get(DEVICE_HEADER)?.trim();
  return id && id.length > 0 ? id : null;
};

export const POST = async (req: Request) => {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );
  }

  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return NextResponse.json(
      { error: `Missing ${DEVICE_HEADER} header` },
      { status: 401 },
    );
  }

  let body: { doseMg?: number; injectionSite?: string; takenAt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const doseMg = Number(body.doseMg);
  if (!Number.isFinite(doseMg) || doseMg <= 0) {
    return NextResponse.json(
      { error: 'doseMg must be a positive number' },
      { status: 400 },
    );
  }

  const site = body.injectionSite as InjectionSite | undefined;
  if (site && !VALID_SITES.has(site)) {
    return NextResponse.json(
      { error: 'injectionSite is not a valid site' },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const { medication } = await resolveUserAndMedication(deviceId);

    const dose = await db.doseLog.create({
      data: {
        medicationId: medication.id,
        doseMg,
        injectionSite: site ?? null,
        takenAt: body.takenAt ? new Date(body.takenAt) : undefined,
      },
    });

    return NextResponse.json({ dose }, { status: 201 });
  } catch (error) {
    console.error('[api/doses] POST failed', error);
    return NextResponse.json({ error: 'Failed to log dose' }, { status: 500 });
  }
};

export const GET = async (req: Request) => {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 },
    );
  }

  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return NextResponse.json(
      { error: `Missing ${DEVICE_HEADER} header` },
      { status: 401 },
    );
  }

  try {
    const db = getDb();
    const { medication } = await resolveUserAndMedication(deviceId);

    const doses = await db.doseLog.findMany({
      where: { medicationId: medication.id, skipped: false },
      orderBy: { takenAt: 'desc' },
      take: 50,
      select: { id: true, doseMg: true, injectionSite: true, takenAt: true },
    });

    return NextResponse.json({ doses });
  } catch (error) {
    console.error('[api/doses] GET failed', error);
    return NextResponse.json(
      { error: 'Failed to load doses' },
      { status: 500 },
    );
  }
};
