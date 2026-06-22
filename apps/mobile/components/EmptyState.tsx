import { Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import { elevation } from '@/lib/elevation';

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  body?: string;
};

// Shared "nothing here yet" card for list-backed screens. Without it, screens
// render blank when their data set is empty — which reads as a bug, not an
// empty state. Used on Today / Doses / Weight / Side-effects / Titration.
export const EmptyState = ({
  icon = 'chart-line',
  title,
  body,
}: EmptyStateProps) => (
  <View
    className="items-center rounded-3xl bg-paper px-6 py-9"
    style={elevation.card}
  >
    <View className="size-14 items-center justify-center rounded-2xl bg-accent">
      <Icon icon={icon} size={22} color="#0e7c7b" />
    </View>
    <Text className="mt-4 text-center font-display-semibold text-[17px] text-ink">
      {title}
    </Text>
    {body ? (
      <Text className="mt-1.5 text-center font-sans text-[13px] leading-[19px] text-muted">
        {body}
      </Text>
    ) : null}
  </View>
);

export default EmptyState;
