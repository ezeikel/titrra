'use server';

import { getDb, isDatabaseConfigured } from '@titrra/db';

// Waitlist capture for the landing page. Persists to the `Waitlist` table
// (DB-backed, like chunky-crayon's EmailSubscriber). Dedups on the unique
// `email` via upsert so a re-submit is idempotent, not a duplicate row.

export type WaitlistResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function joinWaitlist(
  _prev: WaitlistResult | null,
  formData: FormData,
): Promise<WaitlistResult> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const source = String(formData.get('source') ?? 'landing') || 'landing';

  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  if (!isDatabaseConfigured()) {
    // No DB locally / misconfigured — don't silently drop the lead; surface a
    // retry instead of pretending it saved.
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  try {
    const db = getDb();
    // Upsert: a repeat signup refreshes the row (updatedAt / source) instead of
    // erroring on the unique email or duplicating the lead.
    await db.waitlist.upsert({
      where: { email },
      update: { source },
      create: { email, source },
    });
    return { ok: true };
  } catch (error) {
    console.error('[waitlist] signup failed', error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}
