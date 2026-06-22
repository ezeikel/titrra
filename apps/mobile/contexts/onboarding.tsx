import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  commitOnboarding,
  type Drug,
  type SideEffectType,
  type WeightUnit,
} from '@/lib/api';
import { getDrugMeta } from '@/lib/glp1';

const ONBOARDED_KEY = 'titrra.onboarded';
const NAME_KEY = 'titrra.name';

// Accumulated onboarding answers. Nothing is written to the server until
// commit() runs at the value-reveal step, so a mid-quiz drop-off persists
// nothing (clean data).
export type OnboardingData = {
  name: string;
  drug: Drug | null;
  currentDose: number | null;
  goalDose: number | null;
  currentWeight: number | null;
  weightUnit: WeightUnit;
  sideEffects: SideEffectType[];
  remindersOptIn: boolean;
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
};

type OnboardingContextValue = {
  data: OnboardingData;
  set: (patch: Partial<OnboardingData>) => void;
  reset: () => void;
  commit: () => Promise<void>;
  onboarded: boolean | null; // null = still loading the flag
  markOnboarded: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue>({
  data: EMPTY,
  set: () => {},
  reset: () => {},
  commit: async () => {},
  onboarded: null,
  markOnboarded: async () => {},
});

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<OnboardingData>(EMPTY);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY).then((v) => setOnboarded(v === 'true'));
  }, []);

  const set = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setData(EMPTY), []);

  // Send every answer to the server in ONE atomic request. The server applies
  // medication + ladder + weight + side-effects in a single transaction, so a
  // failure rolls everything back (no orphaned partial state) and a retry is
  // safe. Throws on failure so the caller (building.tsx) can show a retry.
  const commit = useCallback(async () => {
    const d = data;

    // Build the titration ladder client-side: current → goal (or current → top
    // of the drug's ladder), guaranteeing the current dose is included.
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
    });
  }, [data]);

  const markOnboarded = useCallback(async () => {
    await AsyncStorage.multiSet([
      [ONBOARDED_KEY, 'true'],
      [NAME_KEY, data.name],
    ]);
    setOnboarded(true);
  }, [data.name]);

  const value = useMemo(
    () => ({ data, set, reset, commit, onboarded, markOnboarded }),
    [data, set, reset, commit, onboarded, markOnboarded],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);

export default OnboardingProvider;
