import type { ReactNode } from 'react';

type Prop = {
  title: string;
  body: string;
  icon: ReactNode;
};

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const PROPS: Prop[] = [
  {
    title: 'Log every dose in a tap',
    body: 'Record your shot or pill with date, mg and injection site in one tap. Reminders make sure shot day never sneaks up on you.',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke} aria-hidden>
        <path d="m18 2 4 4M17 7l3-3M14 6l4 4M8.5 11.5l4 4" />
        <path d="m16 8-8.5 8.5a3.5 3.5 0 0 1-5-5L11 3" />
      </svg>
    ),
  },
  {
    title: 'Rotate injection sites',
    body: 'A body-diagram map tracks where you last injected and suggests the next site — so you never overuse one spot. Best practice, made automatic.',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke} aria-hidden>
        <circle cx="12" cy="5" r="2.5" />
        <path d="M12 7.5v6m0 0-3.5 5m3.5-5 3.5 5M7 10.5l5 1.5 5-1.5" />
      </svg>
    ),
  },
  {
    title: 'Follow your titration ladder',
    body: 'Visualise your 2.5 → 5 → 7.5 → 10mg plan, see where you are on it, and get a nudge when it is time to talk to your provider about stepping up.',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke} aria-hidden>
        <path d="M3 20h4v-4m0 0h4v-4m0 0h4V8m0 0h4V4" />
      </svg>
    ),
  },
  {
    title: 'Track side effects honestly',
    body: 'Log nausea, constipation, fatigue and reflux with severity and timing — then see exactly how they line up with each dose and dose change.',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke} aria-hidden>
        <path d="M3.5 12h4l2-5 3 10 2.5-7 1.5 2h4" />
      </svg>
    ),
  },
  {
    title: 'Watch progress beyond the scale',
    body: 'A clean weight trend, progress photos and non-scale wins in one timeline. Protein and water nudges for the days appetite is low.',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke} aria-hidden>
        <path d="M21 7 13.5 14.5 10 11l-7 7" />
        <path d="M16 7h5v5" />
      </svg>
    ),
  },
  {
    title: 'Bring it to your appointment',
    body: 'Export a clean dose, weight and side-effect summary as a PDF to share with your healthcare provider. Your whole journey, ready to talk through.',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke} aria-hidden>
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M9 13h6m-6 3h6" />
      </svg>
    ),
  },
];

const ValueProps = () => (
  <section id="features" className="border-y border-border bg-white">
    <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
      <span className="eyebrow block text-center text-teal-deep">
        Built for the routine, not the calories
      </span>
      <h2 className="font-heading mx-auto mt-4 max-w-2xl text-balance text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Everything your weight-loss shot needs. Nothing it doesn&apos;t.
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
        Generic food apps focus on calories. Reminder apps focus on alarms.
        Titrra is built for the shot, the sites, the ladder and the side effects
        — the things that actually shape your GLP-1 journey.
      </p>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PROPS.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-border bg-sand p-6 transition hover:border-teal/40 hover:shadow-sm"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-teal-deep">
              <span className="block size-6">{p.icon}</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ValueProps;
