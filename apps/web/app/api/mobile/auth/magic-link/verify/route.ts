import { jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';
import { handleMobileOAuthSignIn } from '@/lib/mobile-auth';

// Redeems a mobile magic-link token. The app opens the deep link and POSTs the
// token here; we verify it (email + deviceId are baked in and signed) and
// link/merge the device into the account, returning a fresh device token.
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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const { token } = (await request.json().catch(() => ({}))) as {
    token?: string;
  };
  if (!token) {
    return NextResponse.json(
      { error: 'token required' },
      { status: 400, headers: corsHeaders },
    );
  }

  let email: string;
  let deviceId: string;
  try {
    const { payload } = await jwtVerify(token, MAGIC_SECRET);
    if (payload.purpose !== 'mobile-magic') throw new Error('wrong purpose');
    email = payload.email as string;
    deviceId = payload.deviceId as string;
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired link' },
      { status: 401, headers: corsHeaders },
    );
  }

  const result = await handleMobileOAuthSignIn(deviceId, email);
  return NextResponse.json(result, { headers: corsHeaders });
}
