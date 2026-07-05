import { SignJWT } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';
import { sendMagicLinkEmail } from '@/app/actions/email';
import { getMobileAuthFromHeaders } from '@/lib/mobile-auth';

// Mobile magic-link: the RN app POSTs { email }. We sign a short-lived
// email+deviceId JWT and email a deep link back to the app. The app opens the
// link → /magic-link/verify redeems the token → device linked to the account.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const MAGIC_SECRET = new TextEncoder().encode(
  process.env.MOBILE_AUTH_SECRET ||
    process.env.NEXT_AUTH_SECRET ||
    'dev-secret-change-me',
);

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
  'https://www.titrra.com';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const { deviceId } = await getMobileAuthFromHeaders(request.headers);
  if (!deviceId) {
    return NextResponse.json(
      { error: 'Device not registered. Call /register first.' },
      { status: 401, headers: corsHeaders },
    );
  }

  const { email } = (await request.json().catch(() => ({}))) as {
    email?: string;
  };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: 'valid email required' },
      { status: 400, headers: corsHeaders },
    );
  }

  const token = await new SignJWT({ email, deviceId, purpose: 'mobile-magic' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(MAGIC_SECRET);

  // Universal link → the app intercepts /auth/magic-link and opens the verify
  // route; if the app isn't installed the web page can guide to the store.
  const url = `${APP_URL}/auth/magic-link?token=${encodeURIComponent(token)}`;

  const result = await sendMagicLinkEmail(email, url);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 500, headers: corsHeaders },
    );
  }
  return NextResponse.json({ sent: true }, { headers: corsHeaders });
}
