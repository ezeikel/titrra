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
  addStep,
  type Drug,
  listSteps,
  logSideEffect,
  logWeight,
  type SideEffectType,
  startStep,
  updateMedication,
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
  goalWeight: number | null;
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
  goalWeight: null,
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

  // Batch every answer to the server. Order matters: medication first (so the
  // titration ladder attaches to the right med), then the ladder, then the
  // optional weight + side-effect seeds.
  const commit = useCallback(async () => {
    const d = data;

    if (d.drug) {
      const meta = getDrugMeta(d.drug);
      await updateMedication({
        drug: d.drug,
        form: meta.form,
        scheduleType: meta.scheduleType,
      });
    }

    // Seed the titration ladder from current → goal dose, then mark the
    // current rung as started (it's where they are today).
    if (d.currentDose != null && d.drug) {
      const meta = getDrugMeta(d.drug);
      const rungs = meta.doses.filter((mg) => {
        if (d.goalDose != null) {
          return mg >= d.currentDose! && mg <= d.goalDose;
        }
        return mg >= d.currentDose!;
      });
      // Guarantee the current dose is present even if it's off-ladder.
      const ladder = rungs.includes(d.currentDose)
        ? rungs
        : [d.currentDose, ...rungs].sort((a, b) => a - b);

      for (const mg of ladder) {
        await addStep({ doseMg: mg });
      }
      // Mark the current dose's rung as started.
      const { steps } = await listSteps();
      const currentStep = steps.find((s) => s.doseMg === d.currentDose);
      if (currentStep) await startStep(currentStep.id);
    }

    if (d.currentWeight != null) {
      await logWeight({ weight: d.currentWeight, unit: d.weightUnit });
    }

    for (const type of d.sideEffects) {
      // Default severity 2 (mild-moderate) for an onboarding pre-existing flag.
      await logSideEffect({ type, severity: 2 });
    }
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
