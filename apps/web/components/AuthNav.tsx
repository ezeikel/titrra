'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

const displayName = (name?: string | null, email?: string | null) =>
  name?.split(' ')[0] || email?.split('@')[0] || 'Account';

const AuthNav = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <span className="inline-block h-5 w-16" aria-hidden />;
  }

  if (!session?.user) {
    return (
      <a
        href="/signin"
        className="text-sm font-medium text-muted-foreground transition hover:text-ink"
      >
        Sign in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-ink">
        {displayName(session.user.name, session.user.email)}
      </span>
      <button
        type="button"
        onClick={() => signOut()}
        className="text-sm font-medium text-muted-foreground transition hover:text-ink"
      >
        Sign out
      </button>
    </div>
  );
};

export default AuthNav;
