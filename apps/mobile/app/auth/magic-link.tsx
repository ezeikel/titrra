import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { trackEvent } from '@/lib/analytics';
import { verifyMagicLink } from '@/lib/api';
import { setSessionToken, setStoredUserId } from '@/lib/auth';

// Redeems a mobile magic-link. The email links to
// www.titrra.com/auth/magic-link?token=… which — via associated domains — opens
// here in the app. We POST the token to the verify route, store the returned
// session, and drop the user into the app signed-in.

const MagicLink = () => {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      if (!token) {
        setFailed(true);
        return;
      }
      try {
        const r = await verifyMagicLink(token);
        await setSessionToken(r.token);
        await setStoredUserId(r.userId);
        trackEvent('sign_in_completed', { method: 'magic_link' });
        router.replace('/(tabs)');
      } catch {
        setFailed(true);
      }
    })();
  }, [token, router]);

  return (
    <View className="flex-1 items-center justify-center gap-3 bg-sand px-8">
      {failed ? (
        <>
          <Text className="text-center font-display-bold text-[20px] text-ink">
            Link expired
          </Text>
          <Text className="text-center font-sans text-[14px] text-muted">
            This sign-in link is invalid or has already been used. Request a new
            one from Settings.
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator color="#0e7c7b" />
          <Text className="font-sans text-[14px] text-muted">
            Signing you in…
          </Text>
        </>
      )}
    </View>
  );
};

export default MagicLink;
