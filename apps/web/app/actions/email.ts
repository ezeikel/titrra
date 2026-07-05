'use server';

import { Resend } from 'resend';

// Titrra transactional email. Currently just the NextAuth magic-link sign-in.
// Requires RESEND_API_KEY + a verified sending domain (titrra.com) — see the
// auth setup notes. Kept as a server action so the route/auth callback stays thin.

// Sends from the verified Resend subdomain (notifications.titrra.com), overridable
// via EMAIL_FROM. Must match a VERIFIED Resend domain or sends are rejected.
const FROM =
  process.env.EMAIL_FROM ?? 'Titrra <no-reply@notifications.titrra.com>';

const getResend = (): Resend | null => {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
};

type SendResult = { success: true } | { success: false; error: string };

export const sendMagicLinkEmail = async (
  email: string,
  url: string,
): Promise<SendResult> => {
  const resend = getResend();
  if (!resend) {
    return {
      success: false,
      error: 'Email is not configured (RESEND_API_KEY)',
    };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Your Titrra sign-in link',
      html: `
        <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a2b29;">
          <h1 style="font-size: 20px; font-weight: 800;">Sign in to Titrra</h1>
          <p style="font-size: 15px; line-height: 1.5; color: #5f706e;">
            Tap the button below to sign in and sync your GLP-1 journey across
            your devices. This link expires shortly and can only be used once.
          </p>
          <p style="margin: 28px 0;">
            <a href="${url}" style="display: inline-block; background: #0e7c7b; color: #fff; text-decoration: none; font-weight: 700; padding: 14px 24px; border-radius: 14px; font-size: 15px;">
              Sign in to Titrra
            </a>
          </p>
          <p style="font-size: 12px; color: #94a3a1;">
            If you didn't request this, you can safely ignore it.
          </p>
        </div>
      `,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send email',
    };
  }
};
