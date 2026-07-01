import StoreBadges from '@/components/StoreBadges';

const FinalCta = () => (
  <section className="bg-sand">
    <div className="mx-auto max-w-4xl px-4 py-20 sm:py-28">
      <div className="rounded-3xl bg-teal-deep px-6 py-14 text-center sm:px-12">
        <h2 className="font-heading mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Your shot routine, finally in one calm place.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-balance text-white/80">
          Download Titrra free on iOS and Android — no account needed to start
          logging your shots.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <StoreBadges placement="hero" onDark className="justify-center" />
        </div>
      </div>
    </div>
  </section>
);

export default FinalCta;
