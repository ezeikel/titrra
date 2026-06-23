// Onboarding progress dots — the active step is a wider teal pill, the rest are
// small mist dots. Mirrors the mobile ProgressDots.
export const ProgressDots = ({
  total,
  activeIndex,
}: {
  total: number;
  activeIndex: number;
}) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: total }).map((_, i) => {
      const active = i === activeIndex;
      return (
        <span
          key={`dot-${i}`}
          className={`h-1.5 rounded-full transition-all ${
            active ? 'w-5 bg-teal' : 'w-1.5 bg-mist'
          }`}
        />
      );
    })}
  </div>
);

export default ProgressDots;
