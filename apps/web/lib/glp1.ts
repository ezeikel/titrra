import type { Drug, MedicationForm, ScheduleType } from '@/lib/api';

// GLP-1 drug metadata — drives onboarding smart defaults (form + schedule
// pre-fill, dose rungs per drug). Education only; doses reflect common labelled
// escalation, the user confirms their own plan with their provider. Mirrors
// apps/mobile/lib/glp1.ts.

export type DrugMeta = {
  drug: Drug;
  label: string;
  generic: string;
  form: MedicationForm;
  scheduleType: ScheduleType;
  // Standard escalation ladder (mg), low → high.
  doses: number[];
};

export const DRUGS: DrugMeta[] = [
  {
    drug: 'MOUNJARO',
    label: 'Mounjaro',
    generic: 'tirzepatide',
    form: 'INJECTION',
    scheduleType: 'WEEKLY',
    doses: [2.5, 5, 7.5, 10, 12.5, 15],
  },
  {
    drug: 'ZEPBOUND',
    label: 'Zepbound',
    generic: 'tirzepatide',
    form: 'INJECTION',
    scheduleType: 'WEEKLY',
    doses: [2.5, 5, 7.5, 10, 12.5, 15],
  },
  {
    drug: 'OZEMPIC',
    label: 'Ozempic',
    generic: 'semaglutide',
    form: 'INJECTION',
    scheduleType: 'WEEKLY',
    doses: [0.25, 0.5, 1, 2],
  },
  {
    drug: 'WEGOVY',
    label: 'Wegovy',
    generic: 'semaglutide',
    form: 'INJECTION',
    scheduleType: 'WEEKLY',
    doses: [0.25, 0.5, 1, 1.7, 2.4],
  },
  {
    drug: 'RYBELSUS',
    label: 'Rybelsus',
    generic: 'semaglutide (oral)',
    form: 'ORAL',
    scheduleType: 'DAILY',
    doses: [3, 7, 14],
  },
  {
    drug: 'COMPOUNDED_SEMAGLUTIDE',
    label: 'Compounded semaglutide',
    generic: 'semaglutide',
    form: 'INJECTION',
    scheduleType: 'WEEKLY',
    doses: [0.25, 0.5, 1, 1.7, 2.4],
  },
  {
    drug: 'COMPOUNDED_TIRZEPATIDE',
    label: 'Compounded tirzepatide',
    generic: 'tirzepatide',
    form: 'INJECTION',
    scheduleType: 'WEEKLY',
    doses: [2.5, 5, 7.5, 10, 12.5, 15],
  },
  {
    drug: 'OTHER',
    label: 'Something else',
    generic: '',
    form: 'INJECTION',
    scheduleType: 'WEEKLY',
    doses: [0.25, 0.5, 1, 2, 2.5, 5, 7.5, 10],
  },
];

export const getDrugMeta = (drug: Drug): DrugMeta =>
  DRUGS.find((d) => d.drug === drug) ?? DRUGS[DRUGS.length - 1];
