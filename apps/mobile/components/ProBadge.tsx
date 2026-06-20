import { Text, View } from 'react-native';
import { usePurchases } from '@/contexts/purchases';

// Small "PRO" pill shown next to gated features for non-subscribers (a gentle
// curiosity driver toward the paywall). Renders nothing once the user is Pro,
// or while the entitlement check is still loading (avoids a flash).
export const ProBadge = () => {
  const { isPro, ready } = usePurchases();
  if (!ready || isPro) return null;

  return (
    <View className="rounded-full bg-teal/15 px-2 py-0.5">
      <Text className="font-sans-bold text-[9px] uppercase tracking-[1px] text-teal-deep">
        Pro
      </Text>
    </View>
  );
};

export default ProBadge;
