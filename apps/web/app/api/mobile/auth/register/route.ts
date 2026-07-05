import { NextResponse } from 'next/server';
import { createDeviceToken, getOrCreateDeviceUser } from '@/lib/mobile-auth';

// The RN app POSTs { deviceId } on first launch → gets an anonymous User + a
// signed device token. Anonymous-first: no sign-in required to use the app.
export async function POST(req: Request) {
  const { deviceId } = (await req.json().catch(() => ({}))) as {
    deviceId?: string;
  };
  if (!deviceId) {
    return NextResponse.json({ error: 'deviceId required' }, { status: 400 });
  }

  const { userId, isNew } = await getOrCreateDeviceUser(deviceId);
  const token = await createDeviceToken(deviceId, userId);
  return NextResponse.json({ userId, token, isNew });
}
