import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { toast } from 'sonner-native';
import { Icon } from '@/components/Icon';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { usePurchases } from '@/contexts/purchases';
import { trackEvent } from '@/lib/analytics';
import { elevation } from '@/lib/elevation';

const Row = ({
  label,
  onPress,
  comingSoon,
  destructive,
  loading,
  first,
}: {
  label: string;
  onPress: () => void;
  /** Render disabled with a "Soon" badge (not-yet-built features). */
  comingSoon?: boolean;
  /** Tint the label red for destructive actions (clear data). */
  destructive?: boolean;
  /** Show a spinner + disable while an async action is in flight. */
  loading?: boolean;
  /** First row in a card group — omits the top hairline divider. */
  first?: boolean;
}) => (
  <Pressable
    onPress={comingSoon || loading ? undefined : onPress}
    disabled={comingSoon || loading}
    accessibilityRole="button"
    accessibilityState={{ disabled: comingSoon || loading, busy: loading }}
    accessibilityLabel={comingSoon ? `${label}, coming soon` : label}
    className={`flex-row items-center justify-between px-4 py-4 ${
      first ? '' : 'border-t border-border'
    } ${comingSoon ? 'opacity-50' : 'active:bg-mist'}`}
  >
    <Text
      className={`font-sans-semibold text-[15px] ${
        destructive ? 'text-destructive' : 'text-ink'
      }`}
    >
      {label}
    </Text>
    {loading ? (
      <ActivityIndicator size="small" color="#5f706e" />
    ) : comingSoon ? (
      <View className="rounded-full bg-mist px-2.5 py-1">
        <Text className="font-sans-bold text-[10px] uppercase tracking-[1px] text-muted">
          Soon
        </Text>
      </View>
    ) : (
      <Icon icon="chevron-right" size={14} color="#93a09d" />
    )}
  </Pressable>
);

const Settings = () => {
  const router = useRouter();
  const { isPro, restore } = usePurchases();
  const [restoring, setRestoring] = useState(false);

  const onRestore = async () => {
    if (restoring) return; // guard double-tap
    setRestoring(true);
    try {
      const ok = await restore();
      trackEvent('purchase_restored', { success: ok });
      toast[ok ? 'success' : 'info'](
        ok ? 'Pro restored.' : 'No previous purchases found.',
      );
    } finally {
      setRestoring(false);
    }
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
      <View
        className="overflow-hidden rounded-3xl bg-paper"
        style={elevation.card}
      >
        {!isPro ? (
          <Row
            first
            label="Upgrade to Pro"
            onPress={() => router.push('/paywall')}
          />
        ) : null}
        <Row
          first={isPro}
          label={restoring ? 'Restoring…' : 'Restore purchases'}
          loading={restoring}
          onPress={onRestore}
        />
        {/* Not-yet-built features — shown as "Soon" rather than dead rows. */}
        <Row label="Reminders" comingSoon onPress={() => {}} />
        <Row label="Units (metric / imperial)" comingSoon onPress={() => {}} />
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
