'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  commitOnboarding,
  type Drug,
  type SideEffectType,
  type WeightUnit,
} from '@/lib/api';
import { type BodyShape, setStoredBodyShape } from '@/lib/body-shape';
import { getDrugMeta } from '@/lib/glp1';

const ONBOARDED_KEY = 'titrra.onboarded';
const NAME_KEY = 'titrra.name';

// Accumulated onboarding answers — mirrors apps/mobile/contexts/onboarding.tsx.
// Nothing is written to the server until commit() runs at the value-reveal step,
// so a mid-quiz drop-off persists nothing (clean data).
export type OnboardingData = {
  name: string;
  drug: Drug | null;
  currentDose: number | null;
  goalDose: number | null;
  currentWeight: number | null;
  weightUnit: WeightUnit;
  sideEffects: SideEffectType[];
  remindersOptIn: boolean;
  bodyShape: BodyShape;
};

const EMPTY: OnboardingData = {
  name: '',
  drug: null,
  currentDose: null,
  goalDose: null,
  currentWeight: null,
  weightUnit: 'KG',
  sideEffects: [],
  remindersOptIn: false,
  bodyShape: 'UNSPECIFIED',
};

type OnboardingContextValue = {
  data: OnboardingData;
  set: (patch: Partial<OnboardingData>) => void;
  reset: () => void;
  commit: () => Promise<void>;
  markOnboarded: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue>({
  data: EMPTY,
  set: () => {},
  reset: () => {},
  commit: async () => {},
  markOnboarded: () => {},
});

// Read once on the client whether onboarding has completed.
export const hasOnboarded = (): boolean =>
  typeof localStorage !== 'undefined' &&
  localStorage.getItem(ONBOARDED_KEY) === 'true';

export const getStoredName = (): string =>
  (typeof localStorage !== 'undefined' && localStorage.getItem(NAME_KEY)) || '';

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<OnboardingData>(EMPTY);

  const set = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setData(EMPTY), []);

  // Send every answer to the server in ONE atomic request (server applies
  // medication + ladder + weight + side-effects + body shape in a single
  // transaction). Throws on failure so the caller can retry.
  const commit = useCallback(async () => {
    const d = data;

    let ladder: { doseMg: number[]; currentDose?: number } | undefined;
    if (d.currentDose != null && d.drug) {
      const meta = getDrugMeta(d.drug);
      const rungs = meta.doses.filter((mg) =>
        d.goalDose != null
          ? mg >= d.currentDose! && mg <= d.goalDose
          : mg >= d.currentDose!,
      );
      const doses = rungs.includes(d.currentDose)
        ? rungs
        : [d.currentDose, ...rungs].sort((a, b) => a - b);
      ladder = { doseMg: doses, currentDose: d.currentDose };
    }

    await commitOnboarding({
      medication: d.drug
        ? {
            drug: d.drug,
            form: getDrugMeta(d.drug).form,
            scheduleType: getDrugMeta(d.drug).scheduleType,
          }
        : undefined,
      ladder,
      weight:
        d.currentWeight != null
          ? { weight: d.currentWeight, unit: d.weightUnit }
          : undefined,
      sideEffects: d.sideEffects.length > 0 ? d.sideEffects : undefined,
      bodyShape: d.bodyShape !== 'UNSPECIFIED' ? d.bodyShape : undefined,
    });
  }, [data]);

  const markOnboarded = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ONBOARDED_KEY, 'true');
      localStorage.setItem(NAME_KEY, data.name);
    }
    // Persist the chosen body figure so the Today map shows it immediately.
    setStoredBodyShape(data.bodyShape);
  }, [data.name, data.bodyShape]);

  const value = useMemo(
    () => ({ data, set, reset, commit, markOnboarded }),
    [data, set, reset, commit, markOnboarded],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);

export default OnboardingProvider;
