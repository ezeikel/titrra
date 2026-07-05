import type { Metadata } from 'next';
import { MagicLinkFallback } from '@/components/MagicLinkFallback';

// Fallback web page for the mobile magic-link deep link. When the Titrra app is
// installed, iOS/Android associated domains intercept www.titrra.com/auth/magic-link
// and open the app's own verify screen — this page never renders. It only shows
// when the link is opened WITHOUT the app (desktop, or app not installed), so it
// guides the user to open in / download the app rather than 404-ing. The token is
// redeemed by the app only; the web page never touches it.
export const metadata: Metadata = {
  title: 'Open in the Titrra app',
  description: 'Finish signing in to Titrra by opening this link in the app.',
  robots: { index: false, follow: false },
};

const MagicLinkPage = () => <MagicLinkFallback />;

export default MagicLinkPage;
