import WaitlistForm from '@/components/WaitlistForm';

const Hero = () => (
  <section className="relative overflow-hidden bg-sand">
    <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center sm:py-32">
      <span className="eyebrow text-teal-deep">GLP-1 &amp; shot tracker</span>
      <h1 className="font-heading mt-5 max-w-3xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
        Stay on track with <span className="text-teal">every dose</span>.
      </h1>
      <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
        The focused tracker for your weight-loss-shot routine. Log your dose,
        rotate injection sites, follow your titration ladder, and track side
        effects and weight — built for Ozempic, Wegovy, Mounjaro and Zepbound,
        not calories.
      </p>
      <div className="mt-10 flex w-full flex-col items-center gap-3">
        <WaitlistForm />
        <p className="text-xs text-muted-foreground">
          Join the waitlist — be first when Titrra launches on iOS &amp;
          Android.
        </p>
      </div>
    </div>
  </section>
);

export default Hero;
