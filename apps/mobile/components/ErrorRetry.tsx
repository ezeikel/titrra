import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';

type ErrorRetryProps = {
  message: string;
  /** Called when the user taps Retry. Omit to render the error without a button. */
  onRetry?: () => void;
  /** Disable Retry while a request is already in flight. */
  retrying?: boolean;
};

// Shared inline error card with a Retry affordance. Replaces the bare error
// banners that left users force-closing the app to recover. Matches the
// existing destructive-tinted card style used across the data screens.
export const ErrorRetry = ({ message, onRetry, retrying }: ErrorRetryProps) => (
  <View className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
    <View className="flex-row items-start gap-2">
      <Icon icon="triangle-exclamation" size={16} color="#dc2626" />
      <Text className="flex-1 font-sans text-[13px] leading-[18px] text-ink">
        {message}
      </Text>
    </View>
    {onRetry ? (
      <Pressable
        onPress={onRetry}
        disabled={retrying}
        accessibilityRole="button"
        accessibilityState={{ disabled: retrying }}
        accessibilityLabel="Retry"
        className={`mt-3 self-start rounded-lg px-4 py-2 ${
          retrying ? 'bg-teal/50' : 'bg-teal active:bg-teal-deep'
        }`}
      >
        <Text className="font-sans-semibold text-[13px] text-paper">
          {retrying ? 'Retrying…' : 'Try again'}
        </Text>
      </Pressable>
    ) : null}
  </View>
);

export default ErrorRetry;
