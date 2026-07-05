import { type NextRequest, NextResponse } from 'next/server';
import {
  getMobileAuthFromHeaders,
  handleMobileOAuthSignIn,
} from '@/lib/mobile-auth';

// The RN app runs the native Facebook flow and POSTs the resulting access token.
// We verify it by asking Graph API for the token's email (server-side, using
// the app's own token), so a spoofed email can't be injected.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

  const { accessToken } = (await request.json().catch(() => ({}))) as {
    accessToken?: string;
  };
  if (!accessToken) {
    return NextResponse.json(
      { error: 'accessToken required' },
      { status: 400, headers: corsHeaders },
    );
  }

  let email: string | undefined;
  let name: string | undefined;
  try {
    const res = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!res.ok) throw new Error('graph error');
    const data = (await res.json()) as {
      email?: string;
      name?: string;
      error?: unknown;
    };
    if (data.error) throw new Error('invalid token');
    email = data.email;
    name = data.name;
  } catch {
    return NextResponse.json(
      { error: 'Invalid Facebook token' },
      { status: 401, headers: corsHeaders },
    );
  }
  if (!email) {
    return NextResponse.json(
      { error: 'Facebook token has no email' },
      { status: 400, headers: corsHeaders },
    );
  }

  const result = await handleMobileOAuthSignIn(deviceId, email, name);
  return NextResponse.json(result, { headers: corsHeaders });
}
