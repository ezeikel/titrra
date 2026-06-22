import { Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { PAYWALL_TRUST } from '@/lib/paywall';

// Social proof — overlapping initials cluster + star rating + review count.
// COMPLIANCE: no testimonials / outcome claims, just rating + count.
export const TrustStrip = () => {
  const { rating, count, initials } = PAYWALL_TRUST;
  return (
    <View className="flex-row items-center justify-center gap-3">
      {/* Avatar cluster */}
      <View className="flex-row">
        {initials.map((ini, i) => (
          <View
            key={ini}
            className="size-7 items-center justify-center rounded-full border-2 border-sand bg-teal"
            style={{ marginLeft: i === 0 ? 0 : -10 }}
          >
            <Text className="font-sans-bold text-[10px] text-paper">{ini}</Text>
          </View>
        ))}
      </View>

      {/* Rating */}
      <View className="flex-row items-center gap-1.5">
        <View className="flex-row gap-0.5">
          {[0, 1, 2, 3, 4].map((s) => (
            <Icon key={s} icon="star" size={12} color="#c98a2b" />
          ))}
        </View>
        <Text className="font-sans-semibold text-[13px] text-ink">
          {rating.toFixed(1)}
        </Text>
        <Text className="font-sans text-[13px] text-muted">
          · {count}+ reviews
        </Text>
      </View>
    </View>
  );
};

export default TrustStrip;
