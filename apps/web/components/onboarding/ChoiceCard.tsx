type ChoiceCardProps = {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
};

// Big tappable choice card — the workhorse of the quiz. One click selects.
// Mirrors the mobile ChoiceCard.
export const ChoiceCard = ({
  label,
  sublabel,
  selected,
  onPress,
}: ChoiceCardProps) => (
  <button
    type="button"
    onClick={onPress}
    aria-pressed={selected}
    className={`mb-3 flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left shadow-sm transition-colors ${
      selected
        ? 'border-teal bg-accent'
        : 'border-border bg-white hover:bg-mist'
    }`}
  >
    <span className="flex-1 pr-3">
      <span
        className={`block text-[16px] font-semibold ${
          selected ? 'text-teal-deep' : 'text-ink'
        }`}
      >
        {label}
      </span>
      {sublabel ? (
        <span className="mt-0.5 block text-[13px] text-muted-foreground">
          {sublabel}
        </span>
      ) : null}
    </span>
    <span
      className={`flex size-6 items-center justify-center rounded-full border-2 ${
        selected ? 'border-teal bg-teal' : 'border-border'
      }`}
    >
      {selected ? <span className="size-2.5 rounded-full bg-white" /> : null}
    </span>
  </button>
);

export default ChoiceCard;
