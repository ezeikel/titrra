'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/components/Icon';
import {
  type BillingPeriod,
  type DisplayCurrency,
  proPricing,
} from '@/constants';
import { trackEvent } from '@/lib/analytics';
import { getDeviceId } from '@/lib/device';

const PERKS = [
  'Your full dose + weight history',
  'The titration ladder',
  'Medication-level trends',
  'Provider exports',
];

const PaywallPage = () => {
  const [period, setPeriod] = useState<BillingPeriod>('ANNUAL');
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<DisplayCurrency>('USD');

  // Show prices in the visitor's currency (Stripe charges the matching currency
  // at checkout). Defaults to USD until the geo lookup resolves.
  useEffect(() => {
    fetch('/api/currency')
      .then((r) => r.json())
      .then((d: { currency?: DisplayCurrency }) => {
        if (d.currency) setCurrency(d.currency);
      })
      .catch(() => {});
  }, []);

  const pricing = useMemo(() => proPricing(currency), [currency]);

  const checkout = async () => {
    if (loading) return;
    setLoading(true);
    trackEvent('purchase_started', { period });
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-titrra-device': getDeviceId(),
        },
        body: JSON.stringify({ period }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Could not start checkout');
      }
      window.location.href = data.url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not start checkout',
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center bg-sand px-4 py-12">
      <div className="w-full max-w-md">
        <span className="eyebrow text-teal-deep">Titrra Pro</span>
        <h1 className="font-heading mt-3 text-3xl font-extrabold tracking-tight text-ink">
          Your whole GLP-1 journey, unlocked.
        </h1>
        <p className="mt-3 text-muted-foreground">
          One honest price. No confusing tiers, no weekly traps.
        </p>

        {/* Perks */}
        <ul className="mt-6 flex flex-col gap-3">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent text-teal-deep">
                <Icon icon="check" size={14} />
              </span>
              <span className="text-[15px] text-ink">{perk}</span>
            </li>
          ))}
        </ul>

        {/* Plan selector */}
        <div className="mt-8 flex flex-col gap-3">
          {pricing.map((plan) => {
            const selected = plan.period === period;
            return (
              <button
                type="button"
                key={plan.period}
                onClick={() => setPeriod(plan.period)}
                className={`flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-colors ${
                  selected
                    ? 'border-teal bg-white'
                    : 'border-border bg-white/60 hover:bg-white'
                }`}
              >
                <div>
                  <p className="font-semibold text-ink">
                    {plan.label}
                    {plan.bestValue ? (
                      <span className="ml-2 rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Best value
                      </span>
                    ) : null}
                  </p>
                  {plan.note ? (
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {plan.note}
                    </p>
                  ) : null}
                </div>
                <p className="text-right">
                  <span className="text-lg font-bold text-ink">
                    {plan.price}
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    {' '}
                    {plan.cadence}
                  </span>
                </p>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={checkout}
          disabled={loading}
          className={`mt-6 w-full rounded-2xl py-4 text-[16px] font-bold uppercase tracking-[1px] text-white transition-colors ${
            loading ? 'bg-teal/60' : 'bg-teal hover:bg-teal-deep'
          }`}
        >
          {loading ? 'Starting…' : 'Continue'}
        </button>

        {/* Terms + Privacy (App Store Guideline 3.1.2 — required in the paywall). */}
        <p className="mt-4 text-center text-[12px] leading-relaxed text-muted-foreground">
          Subscriptions renew automatically until cancelled. By continuing you
          agree to our{' '}
          <Link href="/terms" className="underline">
            Terms of Use
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="mt-6 text-center text-[11px] leading-[16px] text-muted-foreground">
          For tracking and education only. Not medical advice. Talk to your
          healthcare provider.
        </p>
      </div>
    </div>
  );
};

export default PaywallPage;
