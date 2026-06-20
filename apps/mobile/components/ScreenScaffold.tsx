import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenScaffoldProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Show the App Store Health & Fitness compliance disclaimer at the foot. */
  disclaimer?: boolean;
  children?: ReactNode;
};

// Shared screen chrome so every v1 stub reads consistently. Replace `children`
// with the real feature UI as each screen is built out.
export const ScreenScaffold = ({
  eyebrow,
  title,
  subtitle,
  disclaimer,
  children,
}: ScreenScaffoldProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-paper">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-sans-bold text-[11px] uppercase tracking-[3px] text-teal-deep">
          {eyebrow}
        </Text>
        <Text className="mt-3 font-sans-bold text-[34px] leading-[38px] text-ink">
          {title}
        </Text>
        <Text className="mt-3 font-sans text-[15px] leading-[22px] text-muted">
          {subtitle}
        </Text>

        <View className="mt-8">{children}</View>

        {disclaimer ? (
          <Text className="mt-10 font-sans text-[11px] leading-[16px] text-muted">
            For tracking and education only. Not medical advice. Titrra never
            recommends a dose change — talk to your healthcare provider.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default ScreenScaffold;
