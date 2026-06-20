import { getDb, isDatabaseConfigured, type WeightUnit } from '@titrra/db';
import { NextResponse } from 'next/server';
import {
  DEVICE_HEADER,
  getDeviceId,
  resolveUserAndMedication,
} from '@/app/api/_lib/device-user';

// Weight API — quick weigh-in logging + trend. Belongs to the User (not a
// medication). Mobile → here → @titrra/db → Neon.

const VALID_UNITS = new Set<WeightUnit>(['KG', 'LB']);

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
    const { user } = await resolveUserAndMedication(deviceId);

    const weights = await db.weightLog.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: 'desc' },
      take: 60,
      select: { id: true, weight: true, unit: true, recordedAt: true },
    });

    return NextResponse.json({ weights });
  } catch (error) {
    console.error('[api/weight] GET failed', error);
    return NextResponse.json(
      { error: 'Failed to load weights' },
      { status: 500 },
    );
  }
};

export const POST = async (req: Request) => {
  if (!isDatabaseConfigured()) return noDb();
  const deviceId = getDeviceId(req);
  if (!deviceId) return unauthorized();

  let body: { weight?: number; unit?: string; recordedAt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const weight = Number(body.weight);
  if (!Number.isFinite(weight) || weight <= 0) {
    return NextResponse.json(
      { error: 'weight must be a positive number' },
      { status: 400 },
    );
  }

  const unit = body.unit as WeightUnit | undefined;
  if (!unit || !VALID_UNITS.has(unit)) {
    return NextResponse.json(
      { error: 'unit must be KG or LB' },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const { user } = await resolveUserAndMedication(deviceId);

    const entry = await db.weightLog.create({
      data: {
        userId: user.id,
        weight,
        unit,
        recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
      },
    });

    return NextResponse.json({ weight: entry }, { status: 201 });
  } catch (error) {
    console.error('[api/weight] POST failed', error);
    return NextResponse.json(
      { error: 'Failed to log weight' },
      { status: 500 },
    );
  }
};
