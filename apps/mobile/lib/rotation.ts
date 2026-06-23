// Injection-site rotation logic now lives in @titrra/types so web + mobile share
// one source of truth (the signature feature must behave identically on both).
// This re-export keeps the existing `@/lib/rotation` import sites working.
export {
  INJECTION_SITES,
  type InjectionSite,
  isOverusingRegion,
  type RecentDose,
  SITE_LABELS,
  suggestNextSite,
} from '@titrra/types';
