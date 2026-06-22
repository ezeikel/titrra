import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';

type OnboardingStepProps = {
  // 1-based step index + total, drives the progress bar. Omit on the welcome.
  step?: number;
  total?: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  // Continue button. Disabled when canContinue is false.
  onContinue: () => void;
  continueLabel?: string;
  canContinue?: boolean;
  onSkip?: () => void;
  // Hide the back chevron (e.g. the first step).
  hideBack?: boolean;
};

export const OnboardingStep = ({
  step,
  total,
  title,
  subtitle,
  children,
  onContinue,
  continueLabel = 'Continue',
  canContinue = true,
  onSkip,
  hideBack,
}: OnboardingStepProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pct =
    step != null && total != null ? Math.round((step / total) * 100) : null;

  return (
    <View className="flex-1 bg-paper">
      {/* Header: back + progress + skip */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5">
        <View className="h-9 flex-row items-center justify-between">
          {!hideBack && router.canGoBack() ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="size-9 items-center justify-center"
            >
              <Icon icon="chevron-left" size={18} color="#5a6b69" />
            </Pressable>
          ) : (
            <View className="size-9" />
          )}
          {pct != null ? (
            <Text className="font-sans-semibold text-[12px] text-muted">
              {step} of {total}
            </Text>
          ) : (
            <View />
          )}
          {onSkip ? (
            <Pressable
              onPress={onSkip}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Skip this step"
            >
              <Text className="font-sans-semibold text-[14px] text-muted">
                Skip
              </Text>
            </Pressable>
          ) : (
            <View className="w-9" />
          )}
        </View>
        {pct != null ? (
          <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist">
            <View
              className="h-full rounded-full bg-teal"
              style={{ width: `${pct}%` }}
            />
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-sans-bold text-[30px] leading-[34px] text-ink">
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-3 font-sans text-[15px] leading-[22px] text-muted">
            {subtitle}
          </Text>
        ) : null}
        <View className="mt-7">{children}</View>
      </ScrollView>

      {/* Sticky continue bar */}
      <View style={{ paddingBottom: insets.bottom + 12 }} className="px-5 pt-3">
        <Pressable
          onPress={onContinue}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
          accessibilityLabel={continueLabel}
          className={`items-center rounded-2xl px-6 py-4 ${
            canContinue ? 'bg-teal active:bg-teal-deep' : 'bg-teal/40'
          }`}
        >
          <Text className="font-sans-bold text-[16px] uppercase tracking-[1px] text-paper">
            {continueLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default OnboardingStep;
