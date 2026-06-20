import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { toast } from 'sonner-native';
import { Icon } from '@/components/Icon';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { usePurchases } from '@/contexts/purchases';
import { trackEvent } from '@/lib/analytics';

const Row = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center justify-between border-b border-border py-4 active:opacity-70"
  >
    <Text className="font-sans-medium text-[15px] text-ink">{label}</Text>
    <Icon icon="chevron-right" size={14} color="#5a6b69" />
  </Pressable>
);

const Settings = () => {
  const router = useRouter();
  const { isPro, restore } = usePurchases();

  const onRestore = async () => {
    const ok = await restore();
    trackEvent('purchase_restored', { success: ok });
    toast[ok ? 'success' : 'info'](
      ok ? 'Pro restored.' : 'No previous purchases found.',
    );
  };

  return (
    <ScreenScaffold
      eyebrow="Account"
      title="Settings"
      subtitle={
        isPro
          ? "You're on Titrra Pro. Thank you."
          : 'Manage your plan, reminders and units.'
      }
    >
      <View>
        {!isPro ? (
          <Row label="Upgrade to Pro" onPress={() => router.push('/paywall')} />
        ) : null}
        <Row label="Restore purchases" onPress={onRestore} />
        <Row
          label="Reminders"
          onPress={() => {
            // TODO: dose / weigh-in reminder schedule (expo-notifications).
            trackEvent('reminder_set', { source: 'settings' });
          }}
        />
        <Row
          label="Units (metric / imperial)"
          onPress={() => {
            // TODO: toggle User.units.
          }}
        />
        <Row
          label="Export for my provider"
          onPress={() => {
            // TODO: Pro-gated PDF/CSV export (spec §3 item 10).
            if (!isPro) {
              router.push('/paywall');
              return;
            }
            trackEvent('export_generated', { source: 'settings' });
          }}
        />
      </View>
    </ScreenScaffold>
  );
};

export default Settings;
