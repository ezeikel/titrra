import { NextRequest, NextResponse } from 'next/server';

// Cookie mirror of the localStorage onboarding flag, written in
// contexts/onboarding.tsx markOnboarded() so the edge can gate without JS.
const ONBOARDED_COOKIE = 'titrra.onboarded';

// Next.js 16: middleware.ts is renamed proxy.ts.
// Two responsibilities:
//  1. Reverse-proxy PostHog (EU cloud) through /ingest so ad blockers don't
//     drop analytics. Server-side capture must NOT use this — it goes direct
//     to eu.i.posthog.com.
//  2. Gate the tracker at /app: a visitor who hasn't completed onboarding is
//     redirected to the onboarding flow (marketing lives at /).
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = request.nextUrl;

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
  matcher: ['/ingest/:path*', '/app/:path*'],
};
