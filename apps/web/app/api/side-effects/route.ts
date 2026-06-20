import { getDb, isDatabaseConfigured, type SideEffectType } from '@titrra/db';
import { NextResponse } from 'next/server';
import {
  DEVICE_HEADER,
  getDeviceId,
  resolveUserAndMedication,
} from '@/app/api/_lib/device-user';

// Side-effects API — log how you're feeling (type + 1–5 severity + notes).
// Belongs to the User. Mobile → here → @titrra/db → Neon.

const VALID_TYPES = new Set<SideEffectType>([
  'NAUSEA',
  'CONSTIPATION',
  'DIARRHEA',
  'FATIGUE',
  'REFLUX',
  'HEADACHE',
  'INJECTION_SITE_REACTION',
  'OTHER',
]);

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

    const sideEffects = await db.sideEffectLog.findMany({
      where: { userId: user.id },
      orderBy: { occurredAt: 'desc' },
      take: 60,
      select: {
        id: true,
        type: true,
        severity: true,
        notes: true,
        occurredAt: true,
      },
    });

    return NextResponse.json({ sideEffects });
  } catch (error) {
    console.error('[api/side-effects] GET failed', error);
    return NextResponse.json(
      { error: 'Failed to load side effects' },
      { status: 500 },
    );
  }
};

export const POST = async (req: Request) => {
  if (!isDatabaseConfigured()) return noDb();
  const deviceId = getDeviceId(req);
  if (!deviceId) return unauthorized();

  let body: {
    type?: string;
    severity?: number;
    notes?: string;
    occurredAt?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const type = body.type as SideEffectType | undefined;
  if (!type || !VALID_TYPES.has(type)) {
    return NextResponse.json(
      { error: 'type is not a valid side effect' },
      { status: 400 },
    );
  }

  const severity = Number(body.severity);
  if (!Number.isInteger(severity) || severity < 1 || severity > 5) {
    return NextResponse.json(
      { error: 'severity must be an integer from 1 to 5' },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const { user } = await resolveUserAndMedication(deviceId);

    const entry = await db.sideEffectLog.create({
      data: {
        userId: user.id,
        type,
        severity,
        notes: body.notes?.trim() || undefined,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
      },
    });

    return NextResponse.json({ sideEffect: entry }, { status: 201 });
  } catch (error) {
    console.error('[api/side-effects] POST failed', error);
    return NextResponse.json(
      { error: 'Failed to log side effect' },
      { status: 500 },
    );
  }
};
