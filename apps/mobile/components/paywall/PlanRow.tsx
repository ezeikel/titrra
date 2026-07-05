import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { elevation } from '@/lib/elevation';

type PlanRowProps = {
  title: string;
  // null = the localized store price hasn't loaded yet. We render a skeleton
  // rather than a hardcoded currency string, so a user never sees a wrong-
  // currency placeholder (e.g. "$39.99" to a UK shopper).
  price: string | null;
  note?: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
};

// Selectable plan row — radio on the left, price on the right, optional badge
// ("Best value") + sub-note. Selected = teal border + accent fill + a left
// radio dot + card elevation (mirrors ChoiceCard's selected treatment).
export const PlanRow = ({
  title,
  price,
  note,
  badge,
  selected,
  onPress,
}: PlanRowProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    accessibilityLabel={`${title} plan${price ? `, ${price}` : ''}${
      note ? `, ${note}` : ''
    }`}
    style={selected ? elevation.card : undefined}
    className={`flex-row items-center gap-3.5 rounded-2xl border-2 px-4 py-4 ${
      selected ? 'border-teal bg-accent' : 'border-border bg-paper'
    }`}
  >
    {/* Radio */}
    <View
      className={`size-6 items-center justify-center rounded-full border-2 ${
        selected ? 'border-teal bg-teal' : 'border-border'
      }`}
    >
      {selected ? <Icon icon="check" size={12} color="#ffffff" /> : null}
    </View>

    {/* Title + note */}
    <View className="flex-1">
      <View className="flex-row items-center gap-2">
        <Text className="font-sans-bold text-[16px] text-ink">{title}</Text>
        {badge ? (
          <View className="rounded-full bg-teal px-2 py-0.5">
            <Text className="font-sans-bold text-[9px] uppercase tracking-[1px] text-paper">
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      {note ? (
        <Text className="mt-0.5 font-sans text-[12px] text-muted">{note}</Text>
      ) : null}
    </View>

    {price ? (
      <Text className="font-display-bold text-[16px] text-ink">{price}</Text>
    ) : (
      // Price skeleton — shown until StoreKit returns the localized price.
      <View className="h-4 w-16 rounded-full bg-border/60" />
    )}
  </Pressable>
);

export default PlanRow;
