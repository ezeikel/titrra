import { createRemoteJWKSet, jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';
import {
  getMobileAuthFromHeaders,
  handleMobileOAuthSignIn,
} from '@/lib/mobile-auth';

// The RN app runs native Sign in with Apple and POSTs the identityToken (+ the
// name, only present on FIRST sign-in). We verify the token against Apple's
// public JWKS and extract the trusted email.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const appleJWKS = createRemoteJWKSet(
  new URL('https://appleid.apple.com/auth/keys'),
);

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

  const { identityToken, name } = (await request.json().catch(() => ({}))) as {
    identityToken?: string;
    name?: string;
  };
  if (!identityToken) {
    return NextResponse.json(
      { error: 'identityToken required' },
      { status: 400, headers: corsHeaders },
    );
  }

  let email: string | undefined;
  try {
    const { payload } = await jwtVerify(identityToken, appleJWKS, {
      issuer: 'https://appleid.apple.com',
      // Audience is the app's bundle id (the Apple "client id" for native).
      audience: [
        process.env.APPLE_CLIENT_ID,
        process.env.EXPO_PUBLIC_APPLE_BUNDLE_ID,
        'com.chewybytes.titrra.app',
      ].filter(Boolean) as string[],
    });
    email = payload.email as string | undefined;
  } catch {
    return NextResponse.json(
      { error: 'Invalid Apple token' },
      { status: 401, headers: corsHeaders },
    );
  }
  if (!email) {
    return NextResponse.json(
      { error: 'Apple token has no email' },
      { status: 400, headers: corsHeaders },
    );
  }

  const result = await handleMobileOAuthSignIn(deviceId, email, name);
  return NextResponse.json(result, { headers: corsHeaders });
}
