import { jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';

// Cookie mirror of the localStorage onboarding flag, written in
// contexts/onboarding.tsx markOnboarded() so the edge can gate without JS.
const ONBOARDED_COOKIE = 'titrra.onboarded';

// Edge-safe (jose-only) verification of the mobile device JWT. We can't import
// lib/mobile-auth here — it pulls in Prisma, which isn't Edge-compatible — so
// the token check is inlined. Must match createDeviceToken's secret + alg.
const MOBILE_SECRET = new TextEncoder().encode(
  process.env.MOBILE_AUTH_SECRET ||
    process.env.NEXT_AUTH_SECRET ||
    'dev-secret-change-me',
);

const HEADER_USER_ID = 'x-user-id';

const verifiedUserIdFromBearer = async (
  authHeader: string | null,
): Promise<string | null> => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), MOBILE_SECRET);
    return (payload.userId as string) ?? null;
  } catch {
    return null;
  }
};

// Next.js 16: middleware.ts is renamed proxy.ts.
// Two responsibilities:
//  1. Reverse-proxy PostHog (EU cloud) through /ingest so ad blockers don't
//     drop analytics. Server-side capture must NOT use this — it goes direct
//     to eu.i.posthog.com.
//  2. Gate the tracker at /app: a visitor who hasn't completed onboarding is
//     redirected to the onboarding flow (marketing lives at /).
export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = request.nextUrl;

  // Identity injection for the API surface. SECURITY: strip any client-supplied
  // x-user-id first (only the middleware may set it, after verifying a signed
  // Bearer token), then inject the verified id so downstream getUserId() can
  // trust the header. NextAuth's own routes are skipped. Anonymous requests
  // (no/invalid token) pass through with no x-user-id → getUserId falls back to
  // the device header.
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete(HEADER_USER_ID);
    const userId = await verifiedUserIdFromBearer(
      request.headers.get('authorization'),
    );
    if (userId) requestHeaders.set(HEADER_USER_ID, userId);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname.startsWith('/ingest')) {
    const hostname = pathname.startsWith('/ingest/static/')
      ? 'eu-assets.i.posthog.com'
      : 'eu.i.posthog.com';

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('host', hostname);

    url.protocol = 'https';
    url.hostname = hostname;
    url.port = '443';
    url.pathname = pathname.replace(/^\/ingest/, '');

    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Gate /app and its sub-routes on the onboarded cookie. Un-onboarded users
  // are sent to onboarding; the client-side (app)/layout gate is a second
  // layer for users who clear the cookie mid-session.
  if (pathname === '/app' || pathname.startsWith('/app/')) {
    const onboarded = request.cookies.get(ONBOARDED_COOKIE)?.value === '1';
    if (!onboarded) {
      url.pathname = '/onboarding';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/ingest/:path*', '/app/:path*', '/api/:path*'],
};
