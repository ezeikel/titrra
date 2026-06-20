import { getDb, isDatabaseConfigured } from '@titrra/db';
import { NextResponse } from 'next/server';
import {
  DEVICE_HEADER,
  getDeviceId,
  resolveUserAndMedication,
} from '@/app/api/_lib/device-user';

// Titration API — the namesake feature. The dose-escalation ladder
// (e.g. 2.5 → 5 → 7.5 → 10 mg) for the device's active medication. The
// "current rung" is the highest-order step that has an actualStartDate set.
// Mobile → here → @titrra/db → Neon (mobile can't import Prisma directly).

const unauthorized = () =>
  NextResponse.json(
    { error: `Missing ${DEVICE_HEADER} header` },
    { status: 401 },
  );

const noDb = () =>
  NextResponse.json({ error: 'Database not configured' }, { status: 503 });

export const GET = async (req: Request) => {
  if (!isDatabaseConfigured()) return noDb();
  const deviceId = getDeviceId(req);
  if (!deviceId) return unauthorized();

  try {
    const db = getDb();
    const { medication } = await resolveUserAndMedication(deviceId);

    const steps = await db.titrationStep.findMany({
      where: { medicationId: medication.id },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        doseMg: true,
        order: true,
        plannedStartDate: true,
        actualStartDate: true,
        notes: true,
      },
    });

    return NextResponse.json({ steps });
  } catch (error) {
    console.error('[api/titration] GET failed', error);
    return NextResponse.json(
      { error: 'Failed to load ladder' },
      { status: 500 },
    );
  }
};

export const POST = async (req: Request) => {
  if (!isDatabaseConfigured()) return noDb();
  const deviceId = getDeviceId(req);
  if (!deviceId) return unauthorized();

  let body: {
    doseMg?: number;
    plannedStartDate?: string;
    notes?: string;
  };
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

  try {
    const db = getDb();
    const { medication } = await resolveUserAndMedication(deviceId);

    // Append to the end of the ladder. `order` is derived (max + 1) so the
    // @@unique([medicationId, order]) constraint never collides.
    const last = await db.titrationStep.findFirst({
      where: { medicationId: medication.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (last?.order ?? -1) + 1;

    const step = await db.titrationStep.create({
      data: {
        medicationId: medication.id,
        doseMg,
        order: nextOrder,
        plannedStartDate: body.plannedStartDate
          ? new Date(body.plannedStartDate)
          : undefined,
        notes: body.notes?.trim() || undefined,
      },
    });

    return NextResponse.json({ step }, { status: 201 });
  } catch (error) {
    console.error('[api/titration] POST failed', error);
    return NextResponse.json({ error: 'Failed to add step' }, { status: 500 });
  }
};

// Mark a step as started — sets actualStartDate, making it the current rung.
// The user does this once their provider OKs the step up.
export const PATCH = async (req: Request) => {
  if (!isDatabaseConfigured()) return noDb();
  const deviceId = getDeviceId(req);
  if (!deviceId) return unauthorized();

  let body: { stepId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.stepId) {
    return NextResponse.json({ error: 'stepId is required' }, { status: 400 });
  }

  try {
    const db = getDb();
    const { medication } = await resolveUserAndMedication(deviceId);

    // Scope the update to the device's own medication so one device can't
    // mutate another's ladder.
    const result = await db.titrationStep.updateMany({
      where: { id: body.stepId, medicationId: medication.id },
      data: { actualStartDate: new Date() },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/titration] PATCH failed', error);
    return NextResponse.json(
      { error: 'Failed to update step' },
      { status: 500 },
    );
  }
};
