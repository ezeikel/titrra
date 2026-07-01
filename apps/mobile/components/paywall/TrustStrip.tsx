import { Text, View } from 'react-native';
import { Icon } from '@/components/Icon';

// Honest trust signals for a new app — facts that are actually true, not
// fabricated social proof. COMPLIANCE: no invented ratings, review counts, or
// testimonials (App Store 2.3.x / Play Misrepresentation policy). Swap in a
// real rating + review count only once the app has genuinely earned them.
const SIGNALS: {
  icon: 'shield-halved' | 'check' | 'heart-pulse';
  label: string;
}[] = [
  { icon: 'shield-halved', label: 'Private & secure' },
  { icon: 'check', label: 'No account needed' },
  { icon: 'heart-pulse', label: 'Cancel anytime' },
];

export const TrustStrip = () => (
  <View className="flex-row items-center justify-center gap-4">
    {SIGNALS.map(({ icon, label }) => (
      <View key={label} className="flex-row items-center gap-1.5">
        <Icon icon={icon} size={12} color="#0e7c7b" />
        <Text className="font-sans-semibold text-[12px] text-muted">
          {label}
        </Text>
      </View>
    ))}
  </View>
);

export default TrustStrip;
