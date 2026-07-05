import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { Icon } from '@/components/Icon';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { SocialAuthButtons } from '@/components/SocialAuthButtons';
import { useAuth } from '@/contexts/auth';
import { usePurchases } from '@/contexts/purchases';
import { trackEvent } from '@/lib/analytics';
import { type BodyShape, useBodyShape } from '@/lib/body-shape';
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

// Body-shape preference for the 3D injection-site map. Framed neutrally ("Body
// shape" — which figure to show), never as a clinical/identity field. Three
// options: the two mannequins + a neutral default.
const BODY_SHAPE_OPTIONS: { value: BodyShape; label: string }[] = [
  { value: 'MALE', label: 'Masc' },
  { value: 'FEMALE', label: 'Fem' },
  { value: 'UNSPECIFIED', label: 'Default' },
];

const BodyShapeCard = () => {
  const { bodyShape, setBodyShape, loading } = useBodyShape();

  return (
    <View className="mt-6">
      <Text className="mb-2 px-1 font-sans-bold text-[12px] uppercase tracking-[2px] text-faint">
        Body shape
      </Text>
      <View
        className="overflow-hidden rounded-3xl bg-paper p-4"
        style={elevation.card}
      >
        <Text className="mb-3 font-sans text-[14px] text-muted">
          Which body would you like to see on the injection-site map?
        </Text>
        <View className="flex-row gap-2">
          {BODY_SHAPE_OPTIONS.map((opt) => {
            const active = bodyShape === opt.value;
            return (
              <Pressable
                key={opt.value}
                disabled={loading}
                onPress={() => {
                  setBodyShape(opt.value);
                  trackEvent('body_shape_set', {
                    value: opt.value,
                    source: 'settings',
                  });
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={opt.label}
                className={`flex-1 items-center rounded-2xl border py-3 ${
                  active
                    ? 'border-teal bg-teal/10'
                    : 'border-border bg-transparent active:bg-mist'
                }`}
              >
                <Text
                  className={`font-sans-semibold text-[14px] ${
                    active ? 'text-teal' : 'text-ink'
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const Settings = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPro, restore } = usePurchases();
  const { isSignedIn, signOut } = useAuth();
  const [restoring, setRestoring] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

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
        {/* Optional account linking — sync across devices + web. Anonymous
            users never have to sign in; this only unlocks sync. */}
        {isSignedIn ? (
          <Row label="Sign out" onPress={signOut} />
        ) : (
          <Row
            label="Sign in to sync"
            onPress={() => {
              trackEvent('sign_in_opened', { source: 'settings' });
              setSignInOpen(true);
            }}
          />
        )}
      </View>

      <BodyShapeCard />

      {/* Sign-in modal */}
      <Modal
        visible={signInOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSignInOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View
            style={{ paddingBottom: insets.bottom + 20 }}
            className="rounded-t-3xl bg-sand px-6 pt-5"
          >
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="font-display-bold text-[22px] text-ink">
                Sign in to sync
              </Text>
              <Pressable
                onPress={() => setSignInOpen(false)}
                hitSlop={14}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="size-9 items-center justify-center rounded-full bg-paper"
                style={elevation.card}
              >
                <Icon icon="xmark" size={16} color="#5f706e" />
              </Pressable>
            </View>
            <Text className="mb-5 font-sans text-[14px] text-muted">
              Keep your dose history, weight and Pro across your devices and the
              web. You can keep using Titrra without an account.
            </Text>
            <SocialAuthButtons onSignedIn={() => setSignInOpen(false)} />
          </View>
        </View>
      </Modal>
    </ScreenScaffold>
  );
};

export default Settings;
