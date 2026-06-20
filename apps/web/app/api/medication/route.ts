import {
  type Drug,
  getDb,
  isDatabaseConfigured,
  type MedicationForm,
  type ScheduleType,
} from '@titrra/db';
import { NextResponse } from 'next/server';
import {
  DEVICE_HEADER,
  getDeviceId,
  resolveUserAndMedication,
} from '@/app/api/_lib/device-user';

// Medication API — read + update the device's active medication. Onboarding
// PATCHes the auto-created default (OTHER/INJECTION/WEEKLY) with the user's
// real drug, form and schedule. Mobile → here → @titrra/db → Neon.

const VALID_DRUGS = new Set<Drug>([
  'OZEMPIC',
  'WEGOVY',
  'MOUNJARO',
  'ZEPBOUND',
  'RYBELSUS',
  'COMPOUNDED_SEMAGLUTIDE',
  'COMPOUNDED_TIRZEPATIDE',
  'OTHER',
]);
const VALID_FORMS = new Set<MedicationForm>(['INJECTION', 'ORAL']);
const VALID_SCHEDULES = new Set<ScheduleType>(['WEEKLY', 'DAILY']);

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
    const { medication } = await resolveUserAndMedication(deviceId);
    return NextResponse.json({
      medication: {
        id: medication.id,
        drug: medication.drug,
        form: medication.form,
        scheduleType: medication.scheduleType,
      },
    });
  } catch (error) {
    console.error('[api/medication] GET failed', error);
    return NextResponse.json(
      { error: 'Failed to load medication' },
      { status: 500 },
    );
  }
};

export const PATCH = async (req: Request) => {
  if (!isDatabaseConfigured()) return noDb();
  const deviceId = getDeviceId(req);
  if (!deviceId) return unauthorized();

  let body: { drug?: string; form?: string; scheduleType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const drug = body.drug as Drug | undefined;
  if (drug && !VALID_DRUGS.has(drug)) {
    return NextResponse.json({ error: 'Invalid drug' }, { status: 400 });
  }
  const form = body.form as MedicationForm | undefined;
  if (form && !VALID_FORMS.has(form)) {
    return NextResponse.json({ error: 'Invalid form' }, { status: 400 });
  }
  const scheduleType = body.scheduleType as ScheduleType | undefined;
  if (scheduleType && !VALID_SCHEDULES.has(scheduleType)) {
    return NextResponse.json(
      { error: 'Invalid scheduleType' },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const { medication } = await resolveUserAndMedication(deviceId);

    const updated = await db.medication.update({
      where: { id: medication.id },
      data: {
        ...(drug ? { drug } : {}),
        ...(form ? { form } : {}),
        ...(scheduleType ? { scheduleType } : {}),
      },
      select: { id: true, drug: true, form: true, scheduleType: true },
    });

    return NextResponse.json({ medication: updated });
  } catch (error) {
    console.error('[api/medication] PATCH failed', error);
    return NextResponse.json(
      { error: 'Failed to update medication' },
      { status: 500 },
    );
  }
};
