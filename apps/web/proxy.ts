import { NextRequest, NextResponse } from 'next/server';

// Next.js 16: middleware.ts is renamed proxy.ts.
// Reverse-proxies PostHog (EU cloud) through /ingest so ad blockers don't
// drop analytics. Server-side capture must NOT use this — it goes direct to
// eu.i.posthog.com.
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/ingest/:path*'],
};
