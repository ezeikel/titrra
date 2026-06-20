import { Pressable, Text, View } from 'react-native';

type ChoiceCardProps = {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
};

// Big tappable choice card — the workhorse of the quiz. One tap selects.
export const ChoiceCard = ({
  label,
  sublabel,
  selected,
  onPress,
}: ChoiceCardProps) => (
  <Pressable
    onPress={onPress}
    className={`mb-3 flex-row items-center justify-between rounded-2xl border px-5 py-4 ${
      selected
        ? 'border-teal bg-accent'
        : 'border-border bg-sand active:bg-mist'
    }`}
  >
    <View className="flex-1 pr-3">
      <Text
        className={`font-sans-semibold text-[16px] ${
          selected ? 'text-teal-deep' : 'text-ink'
        }`}
      >
        {label}
      </Text>
      {sublabel ? (
        <Text className="mt-0.5 font-sans text-[13px] text-muted">
          {sublabel}
        </Text>
      ) : null}
    </View>
    <View
      className={`size-6 items-center justify-center rounded-full border-2 ${
        selected ? 'border-teal bg-teal' : 'border-border'
      }`}
    >
      {selected ? <View className="size-2.5 rounded-full bg-paper" /> : null}
    </View>
  </Pressable>
);

export default ChoiceCard;
