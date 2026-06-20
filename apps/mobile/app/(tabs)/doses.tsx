import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { ProBadge } from '@/components/ProBadge';
import { ScreenScaffold } from '@/components/ScreenScaffold';

// Doses / History — the dose log timeline. Pro layers the medication-level
// (pharmacokinetic) curve on top (spec §3, items 7–8). The titration ladder is
// its own screen, reachable from here and from Today.
const Doses = () => {
  const router = useRouter();

  return (
    <ScreenScaffold
      eyebrow="History"
      title="Your doses"
      subtitle="Every shot you've logged, with site and mg. Your titration ladder and medication-level curve live here on Pro."
      disclaimer
    >
      <Pressable
        onPress={() => router.push('/titration')}
        className="flex-row items-center justify-between rounded-2xl border border-border bg-sand p-4 active:bg-mist"
      >
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-sans-semibold text-[15px] text-ink">
              Titration ladder
            </Text>
            <ProBadge />
          </View>
          <Text className="mt-0.5 font-sans text-[13px] text-muted">
            Your dose-escalation plan and where you are on it.
          </Text>
        </View>
        <Icon icon="chevron-right" size={16} color="#5a6b69" />
      </Pressable>

      {/* TODO: render the DoseLog timeline + medication-level curve (Pro-gated
          via usePurchases().isPro → push /paywall when locked). */}
    </ScreenScaffold>
  );
};

export default Doses;
