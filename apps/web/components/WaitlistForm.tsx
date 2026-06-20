'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { joinWaitlist, type WaitlistResult } from '@/app/actions/waitlist';
import { trackEvent } from '@/lib/analytics';

type WaitlistFormProps = {
  variant?: 'default' | 'onDark';
};

const WaitlistForm = ({ variant = 'default' }: WaitlistFormProps) => {
  const [state, formAction, pending] = useActionState<
    WaitlistResult | null,
    FormData
  >(joinWaitlist, null);

  useEffect(() => {
    if (state?.ok) {
      trackEvent('waitlist_joined');
      toast.success("You're on the list. We'll be in touch.");
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  const onDark = variant === 'onDark';

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        name="email"
        required
        placeholder="you@email.com"
        aria-label="Email address"
        className={
          onDark
            ? 'h-12 flex-1 rounded-lg border border-white/25 bg-white/10 px-4 text-base text-white outline-none placeholder:text-white/50 focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/30'
            : 'h-12 flex-1 rounded-lg border border-border bg-white px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/30'
        }
      />
      <button
        type="submit"
        disabled={pending}
        className={
          onDark
            ? 'h-12 rounded-lg bg-white px-6 text-sm font-bold uppercase tracking-wide text-teal-deep transition hover:bg-mist disabled:opacity-60'
            : 'h-12 rounded-lg bg-teal px-6 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-teal-deep disabled:opacity-60'
        }
      >
        {pending ? 'Joining…' : 'Join the waitlist'}
      </button>
    </form>
  );
};

export default WaitlistForm;
