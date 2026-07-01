import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { GLP1_PAGES } from '@/lib/seo/glp1-pages';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'GLP-1 Trackers by Medication',
  description:
    'Track any GLP-1 medication with Titrra — Ozempic, Wegovy, Mounjaro, Zepbound and Rybelsus. Log doses, rotate injection sites, and follow your titration ladder.',
  path: '/glp-1',
});

const Glp1Index = () => (
  <div className="flex min-h-dvh flex-col bg-sand">
    <SiteNav />
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:py-24">
      <span className="eyebrow text-teal-deep">By medication</span>
      <h1 className="font-heading mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Track your GLP-1, whichever you take
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Titrra works for every common GLP-1 and dual-agonist treatment. Pick
        yours to see how tracking works — doses, injection sites, and your
        titration ladder.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {GLP1_PAGES.map((p) => (
          <Link
            key={p.slug}
            href={`/glp-1/${p.slug}`}
            className="group rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-heading text-xl font-bold text-ink group-hover:text-teal-deep">
              {p.label}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{p.generic}</p>
          </Link>
        ))}
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default Glp1Index;
