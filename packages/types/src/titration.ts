// Titration-ladder construction — shared so web + mobile build the SAME ladder
// from a user's current/goal dose during onboarding (a divergence would send
// different ladders to the server from the two clients). Pure + unit-tested.

// Build the rungs of a titration ladder from a drug's full dose list.
// Returns the doses from `currentDose` up to `goalDose` (inclusive), or up to
// the top of the list when no goal is set — always including `currentDose`
// itself even if it isn't one of the drug's standard rungs (a user can be on a
// non-standard dose). Result is sorted ascending.
export const buildLadder = (
  doses: number[],
  currentDose: number,
  goalDose?: number | null,
): number[] => {
  const rungs = doses.filter((mg) =>
    goalDose != null
      ? mg >= currentDose && mg <= goalDose
      : mg >= currentDose,
  );
  return rungs.includes(currentDose)
    ? rungs
    : [currentDose, ...rungs].sort((a, b) => a - b);
};
