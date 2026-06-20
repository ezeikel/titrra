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
