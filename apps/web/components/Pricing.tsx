'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { FadeIn } from '@/components/motion';
import { type DisplayCurrency, proPricing } from '@/constants';

const PRO_PERKS = [
  'Your full dose + weight history',
  'The titration ladder',
  'Medication-level trends',
  'Provider PDF exports',
];

// Honest single-tier pricing in the visitor's currency (Stripe charges the
// matching currency at checkout). No fabricated social proof, one clean tier.
const Pricing = () => {
  const [currency, setCurrency] = useState<DisplayCurrency>('USD');
  useEffect(() => {
    fetch('/api/currency')
      .then((r) => r.json())
      .then((d: { currency?: DisplayCurrency }) => {
        if (d.currency) setCurrency(d.currency);
      })
      .catch(() => {});
  }, []);
  const pricing = useMemo(() => proPricing(currency), [currency]);

  return (
    <section id="pricing" className="border-y border-border bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:py-24">
        <FadeIn>
          <span className="eyebrow block text-center text-teal-deep">
            Pricing
          </span>
          <h2 className="font-heading mx-auto mt-4 max-w-2xl text-balance text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            One honest price. Free to start.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Track your doses, sites and weight for free. Titrra Pro unlocks your
            full history, the titration ladder and provider exports — no
            confusing tiers, no weekly traps.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-12">
          <div className="rounded-3xl border border-border bg-sand p-8">
            <ul className="grid gap-3 sm:grid-cols-2">
              {PRO_PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-accent text-teal-deep">
                    <Icon icon="check" size={14} />
                  </span>
                  <span className="text-[15px] text-ink">{perk}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {pricing.map((plan) => (
                <div
                  key={plan.period}
                  className={`rounded-2xl border-2 bg-white p-4 text-center ${
                    plan.bestValue ? 'border-teal' : 'border-border'
                  }`}
                >
                  <p className="text-sm font-semibold text-ink">{plan.label}</p>
                  <p className="mt-1">
                    <span className="text-xl font-bold text-ink">
                      {plan.price}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {' '}
                      {plan.cadence}
                    </span>
                  </p>
                  {plan.note ? (
                    <p className="mt-1 text-[12px] text-teal-deep">
                      {plan.note}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <Link
              href="/onboarding"
              className="mt-8 block w-full rounded-2xl bg-teal py-4 text-center text-[16px] font-bold uppercase tracking-[1px] text-white transition-colors hover:bg-teal-deep"
            >
              Start free
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Pricing;
