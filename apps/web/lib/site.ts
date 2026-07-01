const FALLBACK_SITE_URL = 'https://titrra.com';

const rawSiteUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
const configuredSiteUrl = (rawSiteUrl || FALLBACK_SITE_URL).replace(/\/+$/, '');
const isLocalSiteUrl = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(
  configuredSiteUrl,
);

export const SITE_URL = isLocalSiteUrl ? FALLBACK_SITE_URL : configuredSiteUrl;

export const siteUrl = (path = '') => {
  if (!path || path === '/') return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

// Live store listings. Titrra is shipped on both stores — marketing CTAs link
// straight to download (no waitlist).
export const APP_STORE_URL =
  'https://apps.apple.com/no/app/titrra-glp-1-shot-tracker/id6782397414';
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.chewybytes.titrra.app';
