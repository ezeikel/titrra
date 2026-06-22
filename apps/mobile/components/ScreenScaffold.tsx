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

// Clearance so the last content clears the floating glass tab bar (≈ bar height
// + its bottom inset). Tab screens scroll under the translucent bar.
const TAB_BAR_CLEARANCE = 96;

// Shared screen chrome — premium-health styling (docs/DESIGN-SYSTEM.md):
// Bricolage display title, warm surface, generous rhythm.
export const ScreenScaffold = ({
  eyebrow,
  title,
  subtitle,
  disclaimer,
  children,
}: ScreenScaffoldProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-sand">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
          paddingHorizontal: 22,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-sans-bold text-[12px] uppercase tracking-[3px] text-teal">
          {eyebrow}
        </Text>
        <Text
          className="mt-2.5 font-display-bold text-[34px] leading-[38px] text-ink"
          allowFontScaling={false}
        >
          {title}
        </Text>
        <Text className="mt-2.5 font-sans text-[15px] leading-[23px] text-muted">
          {subtitle}
        </Text>

        <View className="mt-7">{children}</View>

        {disclaimer ? (
          <Text className="mt-10 font-sans text-[11px] leading-[16px] text-faint">
            For tracking and education only. Not medical advice. Titrra never
            recommends a dose change — talk to your healthcare provider.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default ScreenScaffold;
