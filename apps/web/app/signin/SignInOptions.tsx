'use client';

import {
  faApple,
  faFacebookF,
  faGoogle,
} from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

// The canonical web sign-in surface (mirrors the mobile SocialAuthButtons + the
// chunky-crayon / ptp pattern): Google, Apple, Facebook OAuth, then an email
// magic-link. Titrra is fully usable anonymously (device-first) — this is the
// opt-in "sign in to sync" surface. Which buttons show is computed server-side
// from real env (auth.ts `configuredProviders`) and passed in, so only the
// configured ones render. Styling follows the teal/sand health brand.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type ConfiguredProviders = {
  google: boolean;
  apple: boolean;
  facebook: boolean;
  resend: boolean;
};

const SignInOptions = ({
  callbackUrl,
  providers,
}: {
  callbackUrl: string;
  providers: ConfiguredProviders;
}) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const emailValid = EMAIL_RE.test(email.trim());

  const sendMagicLink = async () => {
    if (!emailValid || sending) return;
    setSending(true);
    // NextAuth Resend provider — redirects to /verify-request on send.
    await signIn('resend', { email: email.trim(), callbackUrl });
  };

  return (
    <div className="flex flex-col gap-3">
      {providers.google ? (
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl })}
          className="flex h-12 items-center justify-center gap-3 rounded-xl border border-border bg-white text-sm font-semibold text-ink transition hover:bg-muted"
        >
          <FontAwesomeIcon icon={faGoogle} className="text-[#EA4335]" />
          Continue with Google
        </button>
      ) : null}

      {providers.apple ? (
        <button
          type="button"
          onClick={() => signIn('apple', { callbackUrl })}
          className="flex h-12 items-center justify-center gap-3 rounded-xl bg-ink text-sm font-semibold text-white transition hover:opacity-90"
        >
          <FontAwesomeIcon icon={faApple} />
          Continue with Apple
        </button>
      ) : null}

      {providers.facebook ? (
        <button
          type="button"
          onClick={() => signIn('facebook', { callbackUrl })}
          className="flex h-12 items-center justify-center gap-3 rounded-xl bg-[#1877F2] text-sm font-semibold text-white transition hover:bg-[#1877F2]/90"
        >
          <FontAwesomeIcon icon={faFacebookF} />
          Continue with Facebook
        </button>
      ) : null}

      {providers.resend ? (
        <>
          <div className="my-1 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">
              or continue with email
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void sendMagicLink();
            }}
            className="h-12 rounded-xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-teal"
          />
          <button
            type="button"
            disabled={!emailValid || sending}
            onClick={() => void sendMagicLink()}
            className="flex h-12 items-center justify-center gap-3 rounded-xl bg-teal text-sm font-semibold text-white transition hover:bg-teal-deep disabled:pointer-events-none disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faEnvelope} />
            {sending ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </>
      ) : null}
    </div>
  );
};

export default SignInOptions;
