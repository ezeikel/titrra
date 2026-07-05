import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faApple,
  faFacebook,
  faGoogle,
} from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { toast } from 'sonner-native';
import { type SignInResult, useAuth } from '@/contexts/auth';
import { elevation } from '@/lib/elevation';

// Optional "sign in to sync" surface (chunky-crayon / ptp pattern). Google is
// always shown; Apple is iOS-only; Facebook only when the FB SDK env is present;
// magic-link is always available. Anonymous users can keep using the app without
// ever signing in — this only unlocks cross-device + web sync.

const facebookEnabled = !!process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

const ProviderButton = ({
  icon,
  color,
  label,
  onPress,
  busy,
}: {
  icon: IconDefinition;
  color: string;
  label: string;
  onPress: () => void;
  busy: boolean;
}) => (
  <Pressable
    onPress={busy ? undefined : onPress}
    disabled={busy}
    accessibilityRole="button"
    accessibilityLabel={label}
    className={`flex-row items-center justify-center gap-3 rounded-2xl bg-paper px-5 py-3.5 ${
      busy ? 'opacity-50' : 'active:bg-mist'
    }`}
    style={elevation.card}
  >
    <FontAwesomeIcon icon={icon} size={18} color={color} />
    <Text className="font-sans-bold text-[15px] text-ink">{label}</Text>
  </Pressable>
);

type Props = {
  /** Called after any successful link so the parent can close a modal / refresh. */
  onSignedIn?: () => void;
};

export const SocialAuthButtons = ({ onSignedIn }: Props) => {
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithFacebook,
    sendMagicLink,
  } = useAuth();
  const [busy, setBusy] = useState<null | string>(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const run = async (key: string, fn: () => Promise<SignInResult>) => {
    setBusy(key);
    try {
      const r = await fn();
      if (r.ok) {
        toast.success('Signed in — your data will sync.');
        onSignedIn?.();
      } else if (!r.cancelled) {
        toast.error("Couldn't sign in. Please try again.");
      }
    } finally {
      setBusy(null);
    }
  };

  const onMagicLink = async () => {
    const value = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      toast.error('Enter a valid email address.');
      return;
    }
    setBusy('magic');
    try {
      const r = await sendMagicLink(value);
      if (r.ok) setSent(true);
      else toast.error(r.error ?? "Couldn't send the link.");
    } finally {
      setBusy(null);
    }
  };

  if (sent) {
    return (
      <View className="items-center gap-2 py-2">
        <Text className="text-center font-sans-bold text-[15px] text-ink">
          Check your email
        </Text>
        <Text className="text-center font-sans text-[13px] text-muted">
          We sent a sign-in link to {email.trim()}. Tap it to finish.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <ProviderButton
        icon={faGoogle}
        color="#EA4335"
        label="Continue with Google"
        onPress={() => run('google', signInWithGoogle)}
        busy={busy === 'google'}
      />
      {Platform.OS === 'ios' ? (
        <ProviderButton
          icon={faApple}
          color="#000000"
          label="Continue with Apple"
          onPress={() => run('apple', signInWithApple)}
          busy={busy === 'apple'}
        />
      ) : null}
      {facebookEnabled ? (
        <ProviderButton
          icon={faFacebook}
          color="#1877F2"
          label="Continue with Facebook"
          onPress={() => run('facebook', signInWithFacebook)}
          busy={busy === 'facebook'}
        />
      ) : null}

      <View className="my-1 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text className="font-sans text-[12px] text-faint">or</Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <View className="gap-2">
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          placeholderTextColor="#94a3a1"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          className="rounded-2xl bg-paper px-4 py-3.5 font-sans text-[15px] text-ink"
          style={elevation.card as object}
        />
        <Pressable
          onPress={busy === 'magic' ? undefined : onMagicLink}
          disabled={busy === 'magic'}
          accessibilityRole="button"
          accessibilityLabel="Email me a sign-in link"
          className={`items-center rounded-2xl px-5 py-3.5 ${
            busy === 'magic' ? 'bg-teal/50' : 'bg-teal active:bg-teal-deep'
          }`}
        >
          <Text className="font-sans-bold text-[15px] text-paper">
            {busy === 'magic' ? 'Sending…' : 'Email me a link'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default SocialAuthButtons;
