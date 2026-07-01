'use client';

import { Icon, type IconName } from '@/components/Icon';
import { trackEvent } from '@/lib/analytics';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site';
import { cn } from '@/lib/utils';

type Placement = 'hero' | 'footer';

const BADGES: {
  platform: 'ios' | 'android';
  href: string;
  icon: IconName;
  topLine: string;
  bottomLine: string;
}[] = [
  {
    platform: 'ios',
    href: APP_STORE_URL,
    icon: 'apple',
    topLine: 'Download on the',
    bottomLine: 'App Store',
  },
  {
    platform: 'android',
    href: PLAY_STORE_URL,
    icon: 'google-play',
    topLine: 'Get it on',
    bottomLine: 'Google Play',
  },
];

// Both apps are live (App Store approved, Play published), so both badges
// always render — no flag gating. The wrapper is a client component so each
// tap fires the `store_badge_clicked` analytics event, matching the house
// convention in go-unbeaten. Pass `onDark` on dark sections (e.g. the final
// CTA panel) to flip to a light outline.
export const StoreBadges = ({
  placement,
  className,
  onDark = false,
}: {
  placement: Placement;
  className?: string;
  onDark?: boolean;
}) => {
  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {BADGES.map((b) => (
        <a
          key={b.platform}
          href={b.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent('store_badge_clicked', {
              platform: b.platform,
              placement,
            })
          }
          className={cn(
            'group inline-flex h-12 items-center gap-3 rounded-xl border px-4 transition-colors',
            onDark
              ? 'border-white/40 text-white hover:border-white'
              : 'border-ink/25 text-ink hover:border-ink',
          )}
        >
          <Icon icon={b.icon} size={22} />
          <span className="flex flex-col text-left leading-none">
            <span className="text-[0.6rem] font-semibold uppercase tracking-wide opacity-70">
              {b.topLine}
            </span>
            <span className="mt-0.5 text-sm font-bold uppercase tracking-wide">
              {b.bottomLine}
            </span>
          </span>
        </a>
      ))}
    </div>
  );
};

export default StoreBadges;
