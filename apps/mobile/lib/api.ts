import { getDeviceId } from '@/lib/device';
import type { InjectionSite } from '@/lib/rotation';

// Thin fetch client for the Titrra web API. Mobile (RN) can't talk to Prisma
// directly, so every persisted action goes through the Next.js route handlers
// on the web app (app/api/*), which use @titrra/db. The device id keys the
// anonymous user (see app/api/doses/route.ts).

const DEVICE_HEADER = 'x-titrra-device';

// EXPO_PUBLIC_API_URL is the local-dev override; production falls back to the
// deployed web app. Trailing slash trimmed so path joins are clean.
const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_APP_URL ||
  'https://titrra.com'
).replace(/\/$/, '');

export type DoseRecord = {
  id: string;
  doseMg: number;
  injectionSite: InjectionSite | null;
  takenAt: string;
};

// User-facing copy that distinguishes "you're offline / can't reach us" from
// "our server erred" — so screens show "check your connection" vs "try again
// shortly" instead of a raw `API 500` / `UnknownHostException` string.
const NETWORK_MESSAGE =
  "Can't reach Titrra. Check your internet connection and try again.";
const SERVER_MESSAGE = 'Something went wrong on our end. Please try again.';

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const deviceId = await getDeviceId();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        [DEVICE_HEADER]: deviceId,
        ...init?.headers,
      },
    });
  } catch {
    // fetch() rejects on DNS/connection failure (offline, host unreachable,
    // web app not deployed) — surface a connection-specific message.
    throw new Error(NETWORK_MESSAGE);
  }

  if (!res.ok) {
    // Server was reachable but errored (4xx/5xx) — distinct from the network
    // failure above. We don't leak the raw status to the user.
    throw new Error(SERVER_MESSAGE);
  }

  return res.json() as Promise<T>;
};

export const logDose = (input: {
  doseMg: number;
  injectionSite: InjectionSite;
  takenAt?: string;
}): Promise<{ dose: DoseRecord }> =>
  request('/api/doses', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const listDoses = (): Promise<{ doses: DoseRecord[] }> =>
  request('/api/doses', { method: 'GET' });

// ─── Titration ladder ────────────────────────────────────────────────────────

export type TitrationStepRecord = {
  id: string;
  doseMg: number;
  order: number;
  plannedStartDate: string | null;
  actualStartDate: string | null;
  notes: string | null;
};

export const listSteps = (): Promise<{ steps: TitrationStepRecord[] }> =>
  request('/api/titration', { method: 'GET' });

export const addStep = (input: {
  doseMg: number;
  plannedStartDate?: string;
  notes?: string;
}): Promise<{ step: TitrationStepRecord }> =>
  request('/api/titration', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const startStep = (stepId: string): Promise<{ ok: true }> =>
  request('/api/titration', {
    method: 'PATCH',
    body: JSON.stringify({ stepId }),
  });

// ─── Weight ──────────────────────────────────────────────────────────────────

export type WeightUnit = 'KG' | 'LB';

export type WeightRecord = {
  id: string;
  weight: number;
  unit: WeightUnit;
  recordedAt: string;
};

export const logWeight = (input: {
  weight: number;
  unit: WeightUnit;
  recordedAt?: string;
}): Promise<{ weight: WeightRecord }> =>
  request('/api/weight', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const listWeights = (): Promise<{ weights: WeightRecord[] }> =>
  request('/api/weight', { method: 'GET' });

// ─── Side effects ────────────────────────────────────────────────────────────

export type SideEffectType =
  | 'NAUSEA'
  | 'CONSTIPATION'
  | 'DIARRHEA'
  | 'FATIGUE'
  | 'REFLUX'
  | 'HEADACHE'
  | 'INJECTION_SITE_REACTION'
  | 'OTHER';

export type SideEffectRecord = {
  id: string;
  type: SideEffectType;
  severity: number;
  notes: string | null;
  occurredAt: string;
};

export const logSideEffect = (input: {
  type: SideEffectType;
  severity: number;
  notes?: string;
  occurredAt?: string;
}): Promise<{ sideEffect: SideEffectRecord }> =>
  request('/api/side-effects', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const listSideEffects = (): Promise<{
  sideEffects: SideEffectRecord[];
}> => request('/api/side-effects', { method: 'GET' });

// ─── Medication ──────────────────────────────────────────────────────────────

export type Drug =
  | 'OZEMPIC'
  | 'WEGOVY'
  | 'MOUNJARO'
  | 'ZEPBOUND'
  | 'RYBELSUS'
  | 'COMPOUNDED_SEMAGLUTIDE'
  | 'COMPOUNDED_TIRZEPATIDE'
  | 'OTHER';

export type MedicationForm = 'INJECTION' | 'ORAL';
export type ScheduleType = 'WEEKLY' | 'DAILY';

export type MedicationRecord = {
  id: string;
  drug: Drug;
  form: MedicationForm;
  scheduleType: ScheduleType;
};

export const updateMedication = (input: {
  drug?: Drug;
  form?: MedicationForm;
  scheduleType?: ScheduleType;
}): Promise<{ medication: MedicationRecord }> =>
  request('/api/medication', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

// Atomic onboarding commit — medication + ladder + weight + side-effects in one
// server transaction, so a mid-way failure rolls back instead of leaving the
// user with orphaned partial records. Replaces the old per-call sequence.
export const commitOnboarding = (input: {
  medication?: {
    drug?: Drug;
    form?: MedicationForm;
    scheduleType?: ScheduleType;
  };
  ladder?: { doseMg: number[]; currentDose?: number };
  weight?: { weight: number; unit?: WeightUnit };
  sideEffects?: SideEffectType[];
}): Promise<{ ok: true }> =>
  request('/api/onboarding', {
    method: 'POST',
    body: JSON.stringify(input),
  });
