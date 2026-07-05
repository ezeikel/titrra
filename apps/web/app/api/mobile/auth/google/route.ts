import { OAuth2Client } from 'google-auth-library';
import { type NextRequest, NextResponse } from 'next/server';
import {
  getMobileAuthFromHeaders,
  handleMobileOAuthSignIn,
} from '@/lib/mobile-auth';

// The RN app runs the native Google flow and POSTs the resulting idToken here.
// We VERIFY it server-side (never trust a client-posted email) and extract the
// trusted email, then link/merge the device into the matching account.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const client = new OAuth2Client();

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

  const { idToken } = (await request.json().catch(() => ({}))) as {
    idToken?: string;
  };
  if (!idToken) {
    return NextResponse.json(
      { error: 'idToken required' },
      { status: 400, headers: corsHeaders },
    );
  }

  const audience = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  ].filter(Boolean) as string[];

  let email: string | undefined;
  let name: string | undefined;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    email = payload?.email;
    name = payload?.name;
  } catch {
    return NextResponse.json(
      { error: 'Invalid Google token' },
      { status: 401, headers: corsHeaders },
    );
  }
  if (!email) {
    return NextResponse.json(
      { error: 'Google token has no email' },
      { status: 400, headers: corsHeaders },
    );
  }

  const result = await handleMobileOAuthSignIn(deviceId, email, name);
  return NextResponse.json(result, { headers: corsHeaders });
}
