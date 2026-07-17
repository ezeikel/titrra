import {
  type BodyShape,
  type Drug,
  getDb,
  isDatabaseConfigured,
  type MedicationForm,
  type ScheduleType,
  type SideEffectType,
  type WeightUnit,
} from '@titrra/db';
import { NextResponse } from 'next/server';
import {
  DEVICE_HEADER,
  getDeviceId,
  resolveUserAndMedication,
} from '@/app/api/_lib/device-user';

// Onboarding commit — applies ALL of a new user's onboarding answers in a
// SINGLE database transaction: medication, the titration ladder (current →
// goal), marking the current rung started, an optional starting weight, and
// any pre-existing side-effect flags. Doing it atomically means a mid-way
// failure rolls everything back instead of leaving orphaned partial records
// (the old per-call sequence in contexts/onboarding.tsx could half-commit).

const unauthorized = () =>
  NextResponse.json(
    { error: `Missing ${DEVICE_HEADER} header` },
    { status: 401 },
  );

const noDb = () =>
  NextResponse.json({ error: 'Database not configured' }, { status: 503 });

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
const VALID_UNITS = new Set<WeightUnit>(['KG', 'LB']);
const VALID_SIDE_EFFECTS = new Set<SideEffectType>([
  'NAUSEA',
  'CONSTIPATION',
  'DIARRHEA',
  'FATIGUE',
  'REFLUX',
  'HEADACHE',
  'INJECTION_SITE_REACTION',
  'OTHER',
]);

const VALID_BODY_SHAPES = new Set<BodyShape>(['MALE', 'FEMALE', 'UNSPECIFIED']);

type OnboardingBody = {
  medication?: { drug?: string; form?: string; scheduleType?: string };
  ladder?: { doseMg: number[]; currentDose?: number };
  weight?: { weight: number; unit?: string };
  sideEffects?: string[];
  bodyShape?: string;
};

export const POST = async (req: Request) => {
  if (!isDatabaseConfigured()) return noDb();
  const deviceId = getDeviceId(req);
  if (!deviceId) return unauthorized();

  let body: OnboardingBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ---- validate up front so we never open a transaction for bad input ----
  const med = body.medication;
  if (med?.drug && !VALID_DRUGS.has(med.drug as Drug)) {
    return NextResponse.json({ error: 'Invalid drug' }, { status: 400 });
  }
  if (med?.form && !VALID_FORMS.has(med.form as MedicationForm)) {
    return NextResponse.json({ error: 'Invalid form' }, { status: 400 });
  }
  if (
    med?.scheduleType &&
    !VALID_SCHEDULES.has(med.scheduleType as ScheduleType)
  ) {
    return NextResponse.json(
      { error: 'Invalid scheduleType' },
      { status: 400 },
    );
  }

  const ladderDoses = Array.isArray(body.ladder?.doseMg)
    ? body.ladder.doseMg.filter((n) => Number.isFinite(n) && n > 0)
    : [];
  const currentDose = body.ladder?.currentDose;

  const weightUnit = (body.weight?.unit as WeightUnit | undefined) ?? 'KG';
  if (body.weight && !VALID_UNITS.has(weightUnit)) {
    return NextResponse.json({ error: 'Invalid weight unit' }, { status: 400 });
  }
  if (
    body.weight &&
    (!Number.isFinite(body.weight.weight) || body.weight.weight <= 0)
  ) {
    return NextResponse.json({ error: 'Invalid weight' }, { status: 400 });
  }

  const sideEffects = Array.isArray(body.sideEffects)
    ? body.sideEffects.filter((t) =>
        VALID_SIDE_EFFECTS.has(t as SideEffectType),
      )
    : [];

  // Body-shape preference for the 3D map (visual only). Ignore unknown/absent;
  // only persist an explicit MALE/FEMALE choice (UNSPECIFIED stays the default).
  const bodyShape =
    body.bodyShape && VALID_BODY_SHAPES.has(body.bodyShape as BodyShape)
      ? (body.bodyShape as BodyShape)
      : undefined;

  try {
    const db = getDb();
    const { user, medication } = await resolveUserAndMedication(deviceId);

    await db.$transaction(async (tx) => {
      // 1. Medication
      if (med?.drug || med?.form || med?.scheduleType) {
        await tx.medication.update({
          where: { id: medication.id },
          data: {
            ...(med.drug ? { drug: med.drug as Drug } : {}),
            ...(med.form ? { form: med.form as MedicationForm } : {}),
            ...(med.scheduleType
              ? { scheduleType: med.scheduleType as ScheduleType }
              : {}),
          },
        });
      }

      // 2. Titration ladder — created in order, idempotent-ish: we clear any
      // existing steps for this med first so a re-run doesn't duplicate the
      // ladder (onboarding only runs once, but a retry after a partial old
      // commit could otherwise collide on @@unique([medicationId, order])).
      if (ladderDoses.length > 0) {
        await tx.titrationStep.deleteMany({
          where: { medicationId: medication.id },
        });
        await tx.titrationStep.createMany({
          data: ladderDoses.map((doseMg, i) => ({
            medicationId: medication.id,
            doseMg,
            order: i,
            // Mark the current dose's rung as started (where they are today).
            actualStartDate:
              currentDose != null && doseMg === currentDose ? new Date() : null,
          })),
        });
      }

      // 3. Starting weight
      if (body.weight) {
        await tx.weightLog.create({
          data: {
            userId: user.id,
            weight: body.weight.weight,
            unit: weightUnit,
          },
        });
      }

      // 4. Pre-existing side-effect flags (default severity 2)
      if (sideEffects.length > 0) {
        await tx.sideEffectLog.createMany({
          data: sideEffects.map((type) => ({
            userId: user.id,
            type: type as SideEffectType,
            severity: 2,
          })),
        });
      }

      // 5. Body-shape preference (only when an explicit choice was made).
      if (bodyShape && bodyShape !== 'UNSPECIFIED') {
        await tx.user.update({
          where: { id: user.id },
          data: { bodyShape },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/onboarding] POST failed', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding' },
      { status: 500 },
    );
  }
};
