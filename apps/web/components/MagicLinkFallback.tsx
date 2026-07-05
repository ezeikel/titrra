'use client';

import { useEffect, useState } from 'react';
import { StoreBadges } from '@/components/StoreBadges';

// Shown only when the magic link is opened without the app intercepting it.
// On mobile web we make one best-effort attempt to hand the token to the app via
// its custom scheme (titrra://auth/magic-link?token=…); if nothing catches it,
// the store badges below let the user install the app and try again. The token
// is never redeemed here — redemption is app-only.
export const MagicLinkFallback = () => {
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return;
    // Best-effort: open the app via its custom scheme. Harmless on desktop
    // (nothing handles it); on mobile it launches the app's verify screen.
    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `titrra://auth/magic-link?token=${encodeURIComponent(
        token,
      )}`;
      setTried(true);
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-heading text-[26px] font-semibold text-ink">
        Open this link in the Titrra app
      </h1>
      <p className="text-muted">
        {tried
          ? 'Trying to open the Titrra app… If nothing happened, make sure the app is installed, then tap the link again from your phone.'
          : 'This sign-in link finishes signing you in inside the Titrra app on your phone. Open the email on the device where Titrra is installed and tap the link again.'}
      </p>
      <StoreBadges placement="footer" className="justify-center" />
      <p className="text-sm text-muted/70">
        Sign-in links expire after 15 minutes. If yours has expired, request a
        new one from the app's Settings.
      </p>
    </main>
  );
};

export default MagicLinkFallback;
