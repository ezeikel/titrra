// Injection-site rotation — the signature feature. Pure logic so it can be
// unit-tested and shared. Given the recent dose history (most-recent-first),
// suggest the next site that's been rested the longest, and warn if the last
// few doses clustered on one region.
//
// The six canonical sites mirror the `InjectionSite` enum in
// `@titrra/db` (packages/db/prisma/schema.prisma): left/right of abdomen,
// thigh and arm.

export const INJECTION_SITES = [
  'ABDOMEN_L',
  'ABDOMEN_R',
  'THIGH_L',
  'THIGH_R',
  'ARM_L',
  'ARM_R',
] as const;

export type InjectionSite = (typeof INJECTION_SITES)[number];

export const SITE_LABELS: Record<InjectionSite, string> = {
  ABDOMEN_L: 'Belly · left',
  ABDOMEN_R: 'Belly · right',
  THIGH_L: 'Thigh · left',
  THIGH_R: 'Thigh · right',
  ARM_L: 'Arm · left',
  ARM_R: 'Arm · right',
};

// The body region a site belongs to — used to discourage hammering one area
// even across its left/right variants.
const SITE_REGION: Record<InjectionSite, 'abdomen' | 'thigh' | 'arm'> = {
  ABDOMEN_L: 'abdomen',
  ABDOMEN_R: 'abdomen',
  THIGH_L: 'thigh',
  THIGH_R: 'thigh',
  ARM_L: 'arm',
  ARM_R: 'arm',
};

export type RecentDose = {
  injectionSite: InjectionSite | null;
  takenAt: string | Date;
};

/**
 * Suggest the next injection site. Picks the site that was used longest ago
 * (or never), breaking ties toward a region that isn't the most recently used.
 *
 * @param history doses ordered most-recent-first
 */
export const suggestNextSite = (history: RecentDose[]): InjectionSite => {
  const used = history
    .map((d) => d.injectionSite)
    .filter((s): s is InjectionSite => s != null);

  // Nothing logged yet → start on the belly (the most common GLP-1 site).
  if (used.length === 0) return 'ABDOMEN_L';

  // Index of most-recent use for each site (lower = more recent). Unused sites
  // get +infinity so they're preferred first.
  const lastUsedIndex = new Map<InjectionSite, number>();
  used.forEach((site, i) => {
    if (!lastUsedIndex.has(site)) lastUsedIndex.set(site, i);
  });

  const lastRegion = SITE_REGION[used[0]];

  const ranked = [...INJECTION_SITES].sort((a, b) => {
    const ra = lastUsedIndex.get(a) ?? Number.POSITIVE_INFINITY;
    const rb = lastUsedIndex.get(b) ?? Number.POSITIVE_INFINITY;
    if (ra !== rb) return rb - ra; // longer-rested first
    // Tie-break: prefer a different region than the last dose.
    const aSame = SITE_REGION[a] === lastRegion ? 1 : 0;
    const bSame = SITE_REGION[b] === lastRegion ? 1 : 0;
    return aSame - bSame;
  });

  return ranked[0];
};

/**
 * True if the last `window` doses were all in the same body region — a nudge
 * to spread injections out (overuse can cause lipohypertrophy).
 */
export const isOverusingRegion = (
  history: RecentDose[],
  window = 3,
): boolean => {
  const recent = history
    .map((d) => d.injectionSite)
    .filter((s): s is InjectionSite => s != null)
    .slice(0, window);
  if (recent.length < window) return false;
  const region = SITE_REGION[recent[0]];
  return recent.every((s) => SITE_REGION[s] === region);
};
