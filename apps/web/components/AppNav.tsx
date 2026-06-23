'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/Icon';

// Tab set + icons match the mobile GlassTabBar exactly (same FontAwesome Pro
// glyphs + labels), so the bottom bar reads identically across web and mobile.
const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Today', icon: 'syringe' },
  { href: '/doses', label: 'Doses', icon: 'chart-line' },
  { href: '/weight', label: 'Weight', icon: 'weight-scale' },
  { href: '/effects', label: 'Effects', icon: 'triangle-exclamation' },
  { href: '/settings', label: 'Settings', icon: 'gear' },
];

// Bottom tab bar mirroring the mobile app's five tabs.
export const AppNav = () => {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-10 border-t border-border bg-sand/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {TABS.map((t) => {
          const active =
            t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-semibold ${
                active ? 'text-teal' : 'text-muted-foreground hover:text-ink'
              }`}
            >
              <Icon icon={t.icon} size={20} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default AppNav;
