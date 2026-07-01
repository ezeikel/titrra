import { FadeIn, StaggerChildren, StaggerItem } from '@/components/motion';

const STEPS = [
  {
    step: '1',
    title: 'Set up your medication',
    body: 'Pick your drug — Ozempic, Wegovy, Mounjaro, Zepbound, Rybelsus or compounded — your dose and your schedule. Takes about a minute.',
  },
  {
    step: '2',
    title: 'Log as you go',
    body: 'Tap to record each dose and injection site. Add a weight, note a side effect. Titrra keeps it all on one calm timeline.',
  },
  {
    step: '3',
    title: 'See the whole picture',
    body: 'Watch your weight trend against your titration ladder, spot side-effect patterns, and export a summary for your next appointment.',
  },
];

const HowItWorks = () => (
  <section id="how" className="bg-sand">
    <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
      <FadeIn>
        <span className="eyebrow block text-center text-teal-deep">
          How it works
        </span>
        <h2 className="font-heading mt-4 text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Less mental load. One place for everything.
        </h2>
      </FadeIn>
      <StaggerChildren className="mt-14 grid gap-8 sm:grid-cols-3">
        {STEPS.map((s) => (
          <StaggerItem key={s.step} className="relative">
            <div className="flex size-10 items-center justify-center rounded-full bg-teal font-bold text-white">
              {s.step}
            </div>
            <h3 className="mt-5 text-lg font-semibold text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {s.body}
            </p>
          </StaggerItem>
        ))}
      </StaggerChildren>
    </div>
  </section>
);

export default HowItWorks;
