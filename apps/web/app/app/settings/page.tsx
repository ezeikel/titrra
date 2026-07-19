'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { trackEvent } from '@/lib/analytics';
import { type BodyShape, useBodyShape } from '@/lib/body-shape';
import { clearDevice } from '@/lib/device';

const BODY_SHAPE_OPTIONS: { value: BodyShape; label: string }[] = [
  { value: 'MALE', label: 'Masc' },
  { value: 'FEMALE', label: 'Fem' },
  { value: 'UNSPECIFIED', label: 'Default' },
];

// Settings — body-shape preference + the anonymous-user reset. (Pro / units /
// reminders land here when those web features ship.)
const SettingsScreen = () => {
  const { data: session } = useSession();
  const { bodyShape, setBodyShape } = useBodyShape();

  const clearAll = () => {
    clearDevice();
    // Also forget onboarding + name so the fresh user starts clean.
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('titrra.onboarded');
      localStorage.removeItem('titrra.name');
      localStorage.removeItem('titrra.bodyShape');
    }
    // Clear the edge-gate cookie mirror too, so the reset user is re-gated
    // out of /app on the next request.
    if (typeof document !== 'undefined') {
      document.cookie = 'titrra.onboarded=; path=/; max-age=0; SameSite=Lax';
    }
    window.location.href = '/';
  };

  return (
    <ScreenScaffold
      eyebrow="Account"
      title="Settings"
      subtitle="Your preferences on this browser."
    >
      {/* Body shape */}
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-[12px] font-bold uppercase tracking-[2px] text-muted-foreground">
          Body shape
        </p>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Which body would you like to see on the injection-site map?
        </p>
        <div className="mt-3 flex gap-2">
          {BODY_SHAPE_OPTIONS.map((opt) => {
            const active = bodyShape === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => {
                  setBodyShape(opt.value);
                  trackEvent('body_shape_set', {
                    value: opt.value,
                    source: 'settings',
                  });
                }}
                className={`flex-1 rounded-2xl border py-3 text-[14px] font-semibold transition-colors ${
                  active
                    ? 'border-teal bg-teal/10 text-teal'
                    : 'border-border text-ink hover:bg-mist'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Account sync — optional; anonymous use never requires sign-in. */}
      <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-[12px] font-bold uppercase tracking-[2px] text-muted-foreground">
          Account
        </p>
        {session?.user ? (
          <>
            <p className="mt-2 text-[14px] text-ink">
              Signed in as {session.user.name || session.user.email}
            </p>
            <button
              type="button"
              onClick={() => signOut()}
              className="mt-4 text-[14px] font-semibold text-muted-foreground hover:text-ink"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Sign in to sync your tracking across devices and the web.
            </p>
            <Link
              href="/signin?callbackUrl=/app/settings"
              className="mt-4 inline-block text-[14px] font-semibold text-teal hover:underline"
            >
              Sign in to sync
            </Link>
          </>
        )}
      </div>

      {/* Anonymous user reset */}
      <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-[12px] font-bold uppercase tracking-[2px] text-muted-foreground">
          This browser
        </p>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Titrra remembers you anonymously in this browser (no account yet).
          Clearing starts a brand-new user and wipes local data.
        </p>
        <button
          type="button"
          onClick={clearAll}
          className="mt-4 text-[14px] font-semibold text-destructive hover:underline"
        >
          Clear user / cookies
        </button>
      </div>
    </ScreenScaffold>
  );
};

export default SettingsScreen;
