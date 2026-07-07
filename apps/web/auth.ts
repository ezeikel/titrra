import { PrismaAdapter } from '@auth/prisma-adapter';
import { getDb } from '@titrra/db';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import AppleProvider from 'next-auth/providers/apple';
import FacebookProvider from 'next-auth/providers/facebook';
import GoogleProvider from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
import { sendMagicLinkEmail } from '@/app/actions/email';
import { generateAppleClientSecret } from '@/lib/apple';

// Web auth = NextAuth v5 with DATABASE sessions (same as chunky-crayon / PTP).
// Mobile uses a separate device-JWT bridge (lib/mobile-auth.ts) — this file is
// the web cookie-session half. Providers are included only when their env is
// present, so the app builds/runs as each provider's credentials get
// provisioned (Titrra-specific OAuth apps), instead of throwing at boot.

// Apple's client secret is a short-lived ES256 JWT, generated at module init.
// Skipped (empty string) when any Apple env var is missing so dev/build still
// starts — the provider only throws if a user actually attempts Apple sign-in.
const appleClientSecret =
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_PRIVATE_KEY
    ? await generateAppleClientSecret({
        teamId: process.env.APPLE_TEAM_ID,
        keyId: process.env.APPLE_KEY_ID,
        clientId: process.env.APPLE_CLIENT_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    : '';

const providers: Provider[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (process.env.APPLE_CLIENT_ID && appleClientSecret) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: appleClientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (
  process.env.FACEBOOK_CONSUMER_APP_ID &&
  process.env.FACEBOOK_CONSUMER_APP_SECRET
) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CONSUMER_APP_ID,
      clientSecret: process.env.FACEBOOK_CONSUMER_APP_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: { params: { scope: 'public_profile email' } },
    }),
  );
}

if (process.env.RESEND_API_KEY) {
  providers.push(
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from:
        process.env.EMAIL_FROM ?? 'Titrra <no-reply@notifications.titrra.com>',
      async sendVerificationRequest({ identifier: email, url }) {
        const result = await sendMagicLinkEmail(email, url);
        if (!result.success) {
          throw new Error(result.error ?? 'Failed to send magic link email');
        }
      },
    }),
  );
}

const config = {
  adapter: PrismaAdapter(getDb()),
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/signin',
    verifyRequest: '/verify-request',
    error: '/auth-error',
  },
  providers,
  callbacks: {
    // Expose the DB user id on the session so server/client code can read the
    // identity without a second roundtrip. With 'database' strategy the `user`
    // arg is the full DB row.
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  secret: process.env.NEXT_AUTH_SECRET,
} satisfies NextAuthConfig;

// Which providers are actually wired up (real server env), so the sign-in UI
// renders exactly the configured buttons. Computed here (server) instead of the
// client, since NEXT_PUBLIC_* flags aren't set in prod and would hide Apple/
// Facebook even though their credentials exist.
export type ConfiguredProviders = {
  google: boolean;
  apple: boolean;
  facebook: boolean;
  resend: boolean;
};

// A FUNCTION (not a module const) so it is evaluated at REQUEST time, not baked
// at build/prerender. Call behind connection() to read live runtime env.
export const getConfiguredProviders = (): ConfiguredProviders => ({
  google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  apple: !!(process.env.APPLE_CLIENT_ID && appleClientSecret),
  facebook: !!(
    process.env.FACEBOOK_CONSUMER_APP_ID &&
    process.env.FACEBOOK_CONSUMER_APP_SECRET
  ),
  resend: !!process.env.RESEND_API_KEY,
});

export const {
  handlers,
  auth,
  signIn,
  signOut,
  // @ts-ignore - NextAuth v5 beta call-signature typing
} = NextAuth(config);
