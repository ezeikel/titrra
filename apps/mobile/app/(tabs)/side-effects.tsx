import { ScreenScaffold } from '@/components/ScreenScaffold';

// Side effects — nausea, constipation, fatigue, reflux and more, with severity
// and timing (free, spec §3 item 6). Pro lines them up against dose changes.
const SideEffects = () => (
  <ScreenScaffold
    eyebrow="Wellbeing"
    title="Side effects"
    subtitle="Log how you're feeling — type, severity and when. See how it tracks against your dose and titration changes."
    disclaimer
  >
    {/* TODO: side-effect quick-log (type + 1–5 severity + notes), persisted
        via @titrra/db SideEffectLog. */}
  </ScreenScaffold>
);

export default SideEffects;
