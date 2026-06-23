'use client';

import { INJECTION_SITES, type InjectionSite } from '@titrra/types';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { type BodyShape, useBodyShape } from '@/lib/body-shape';
import { clearDevice } from '@/lib/device';

// The 3D body map is WebGL + client-only; load it without SSR.
const BodyMap3D = dynamic(
  () => import('@/components/bodymap/BodyMap3D').then((m) => m.BodyMap3D),
  { ssr: false },
);

const BODY_SHAPE_OPTIONS: { value: BodyShape; label: string }[] = [
  { value: 'MALE', label: 'Masc' },
  { value: 'FEMALE', label: 'Fem' },
  { value: 'UNSPECIFIED', label: 'Default' },
];

// Foundation checkpoint: a minimal "Today-lite" shell proving the shared
// backend (device cookie + API client), the reusable 3D body map, the
// body-shape switcher, and the clear-user reset. The full companion app
// (onboarding + all screens) builds on top of this.
const HomePage = () => {
  const { bodyShape, setBodyShape } = useBodyShape();
  const [selected, setSelected] = useState<InjectionSite>('ABDOMEN_L');
  const suggested: InjectionSite = INJECTION_SITES[0];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center px-6 py-10">
      <header className="w-full">
        <p className="text-[12px] font-bold uppercase tracking-[2px] text-teal">
          Today
        </p>
        <h1 className="mt-1 text-[28px] font-bold text-ink">Log today&apos;s shot</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Pick your injection site — rotate the body and click a spot.
        </p>
      </header>

      <section className="mt-8 w-full">
        <BodyMap3D
          selected={selected}
          suggested={suggested}
          onSelect={setSelected}
          bodyShape={bodyShape}
        />
      </section>

      <section className="mt-8 w-full">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-[2px] text-muted-foreground">
          Body shape
        </p>
        <div className="flex gap-2">
          {BODY_SHAPE_OPTIONS.map((opt) => {
            const active = bodyShape === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => setBodyShape(opt.value)}
                className={`flex-1 rounded-2xl border py-3 text-[14px] font-semibold transition-colors ${
                  active
                    ? 'border-teal bg-teal/10 text-teal'
                    : 'border-border text-ink hover:bg-mist'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-10 w-full border-t border-border pt-6">
        <button
          type="button"
          onClick={() => {
            clearDevice();
            window.location.reload();
          }}
          className="text-[14px] font-semibold text-destructive hover:underline"
        >
          Clear user / cookies
        </button>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Starts a fresh anonymous user on this browser.
        </p>
      </section>

      <p className="mt-10 text-center text-[11px] text-muted-foreground">
        For tracking and education only. Not medical advice. Talk to your
        healthcare provider.
      </p>
    </main>
  );
};

export default HomePage;
