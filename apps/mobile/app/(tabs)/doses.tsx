import { ScreenScaffold } from '@/components/ScreenScaffold';

// Doses / History — the dose log timeline. Pro layers the titration ladder and
// the medication-level (pharmacokinetic) curve on top (spec §3, items 7–8).
const Doses = () => (
  <ScreenScaffold
    eyebrow="History"
    title="Your doses"
    subtitle="Every shot you've logged, with site and mg. Your titration ladder and medication-level curve live here on Pro."
    disclaimer
  >
    {/* TODO: render the DoseLog timeline + titration ladder (Pro-gated via
        usePurchases().isPro → push /paywall when locked). */}
  </ScreenScaffold>
);

export default Doses;
