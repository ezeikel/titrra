'use client';

import type { InjectionSite } from '@titrra/types';
import { getDeviceId } from '@/lib/device';

// Thin fetch client for the Titrra API — the web companion app talks to its own
// Next.js route handlers (app/api/*), same-origin, so no base URL is needed.
// The anonymous device id (cookie) is sent as `x-titrra-device`, exactly like
// mobile, so both clients hit the same anonymous-user backend.

const DEVICE_HEADER = 'x-titrra-device';

const NETWORK_MESSAGE =
  "Can't reach Titrra. Check your internet connection and try again.";
const SERVER_MESSAGE = 'Something went wrong on our end. Please try again.';

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const deviceId = getDeviceId();

  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        [DEVICE_HEADER]: deviceId,
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(NETWORK_MESSAGE);
  }

  if (!res.ok) throw new Error(SERVER_MESSAGE);

  return res.json() as Promise<T>;
};

export type DoseRecord = {
  id: string;
  doseMg: number;
  injectionSite: InjectionSite | null;
  takenAt: string;
};

export const logDose = (input: {
  doseMg: number;
  injectionSite: InjectionSite;
  takenAt?: string;
}): Promise<{ dose: DoseRecord }> =>
  request('/api/doses', { method: 'POST', body: JSON.stringify(input) });

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
  request('/api/titration', { method: 'POST', body: JSON.stringify(input) });

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
  request('/api/weight', { method: 'POST', body: JSON.stringify(input) });

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

export const getMedication = (): Promise<{ medication: MedicationRecord }> =>
  request('/api/medication', { method: 'GET' });

export const updateMedication = (input: {
  drug?: Drug;
  form?: MedicationForm;
  scheduleType?: ScheduleType;
}): Promise<{ medication: MedicationRecord }> =>
  request('/api/medication', { method: 'PATCH', body: JSON.stringify(input) });

export const commitOnboarding = (input: {
  medication?: {
    drug?: Drug;
    form?: MedicationForm;
    scheduleType?: ScheduleType;
  };
  ladder?: { doseMg: number[]; currentDose?: number };
  weight?: { weight: number; unit?: WeightUnit };
  sideEffects?: SideEffectType[];
  bodyShape?: 'MALE' | 'FEMALE';
}): Promise<{ ok: true }> =>
  request('/api/onboarding', { method: 'POST', body: JSON.stringify(input) });
