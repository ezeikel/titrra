import { ScreenScaffold } from '@/components/ScreenScaffold';

// Weight — quick entry + trend line (free). Progress photos + the full
// weight × dose × side-effects timeline are Pro (spec §3, items 5 & 9).
const Weight = () => (
  <ScreenScaffold
    eyebrow="Progress"
    title="Weight"
    subtitle="Log a weigh-in and watch the trend. The weight-keeps-you-coming-back habit on a low-engagement weekly cadence."
  >
    {/* TODO: weight entry sheet + trend chart, persisted via @titrra/db. */}
  </ScreenScaffold>
);

export default Weight;
