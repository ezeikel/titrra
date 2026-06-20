'use server';

// Waitlist capture stub. Validates the email and returns a typed result the
// client form renders. TODO: persist (add a `Waitlist` model to packages/db
// via `db:migrate`, or push to a Resend audience) and fire a confirmation
// email. Kept side-effect-light on purpose so the landing page ships first.

export type WaitlistResult =
  | { ok: true }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function joinWaitlist(
  _prev: WaitlistResult | null,
  formData: FormData,
): Promise<WaitlistResult> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  try {
    // TODO: persist the signup. Options, in order of preference:
    //   1. Resend Audience (RESEND_API_KEY) — zero schema, instant broadcast.
    //   2. A `Waitlist` Prisma model (run `db:migrate` to add it) via
    //      `getDb()` from '@titrra/db'.
    // For now we accept and acknowledge so the funnel is live.
    // eslint-disable-next-line no-console
    console.info('[waitlist] signup', { email });
    return { ok: true };
  } catch {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}
