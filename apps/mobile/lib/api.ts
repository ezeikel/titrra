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

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const deviceId = await getDeviceId();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      [DEVICE_HEADER]: deviceId,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: string };
      detail = body.error ? `: ${body.error}` : '';
    } catch {
      // non-JSON error body — ignore
    }
    throw new Error(`API ${res.status}${detail}`);
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
