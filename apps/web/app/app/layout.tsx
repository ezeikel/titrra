'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { AppNav } from '@/components/AppNav';
import { hasOnboarded } from '@/contexts/onboarding';

// App shell — gates on local onboarding state (anonymous-first, no auth yet) and
// hangs the bottom tab bar under every app screen. A user who hasn't finished
// onboarding is sent there first.
const AppLayout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasOnboarded()) {
      router.replace('/onboarding');
      return;
    }
    setReady(true);
  }, [router]);

  // Avoid flashing app content before the onboarding check resolves.
  if (!ready) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <div className="flex-1">{children}</div>
      <AppNav />
    </div>
  );
};

export default AppLayout;
