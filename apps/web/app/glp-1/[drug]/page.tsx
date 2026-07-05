import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import StoreBadges from '@/components/StoreBadges';
import { getGlp1PageBySlug, getGlp1PageSlugs } from '@/lib/seo/glp1-pages';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/schema';
import { siteUrl } from '@/lib/site';

export function generateStaticParams() {
  return getGlp1PageSlugs().map((drug) => ({ drug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ drug: string }>;
}) {
  const { drug } = await params;
  const page = getGlp1PageBySlug(drug);
  if (!page) return buildMetadata({ title: 'Not found', noindex: true });
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: `/glp-1/${page.slug}`,
    keywords: page.keywords,
    // The route's own opengraph-image.tsx (dynamic per-drug card) wins.
    noDefaultOgImage: true,
  });
}

const Glp1DrugPage = async ({
  params,
}: {
  params: Promise<{ drug: string }>;
}) => {
  const { drug } = await params;
  const page = getGlp1PageBySlug(drug);
  if (!page) notFound();

  const url = siteUrl(`/glp-1/${page.slug}`);

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <JsonLd data={faqSchema(page.faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'GLP-1', url: siteUrl('/glp-1') },
          { name: page.label, url },
        ])}
      />

      <SiteNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <span className="eyebrow text-teal-deep">{page.generic}</span>
        <h1 className="font-heading mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          The {page.label} tracker
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {page.intro}
        </p>

        <div className="mt-8">
          <StoreBadges placement="hero" />
        </div>

        {/* Dose ladder — shown as "the plan you set", never prescriptive. */}
        <section className="mt-12 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-ink">
            The {page.label} titration ladder
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {page.label} is a {page.schedule} {page.form}. The common labelled
            escalation is below — your own plan may differ.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2">
            {page.doses.map((d, i) => (
              <span key={d} className="flex items-center">
                <span className="rounded-lg bg-mist px-3 py-1.5 text-[15px] font-bold text-ink">
                  {d} mg
                </span>
                {i < page.doses.length - 1 ? (
                  <span className="px-1 text-[13px] font-bold text-teal-deep">
                    →
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="font-heading text-2xl font-bold text-ink">
            {page.label} tracking, answered
          </h2>
          <div className="mt-6 divide-y divide-border">
            {page.faqs.map((f) => (
              <details key={f.question} className="group py-5">
                <summary className="cursor-pointer list-none font-semibold text-ink">
                  {f.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-12 flex flex-col items-start gap-4 rounded-3xl bg-teal-deep p-8">
          <h2 className="font-heading text-2xl font-bold text-white">
            Start tracking {page.label} today
          </h2>
          <p className="text-white/80">
            Free to start on iOS and Android — no account needed. Or{' '}
            <Link
              href="/onboarding"
              className="font-semibold text-white underline"
            >
              try it in your browser
            </Link>
            .
          </p>
          <StoreBadges placement="hero" onDark />
        </div>

        {/* Mandatory compliance disclaimer. */}
        <aside
          role="note"
          className="mt-12 rounded-2xl border border-mist bg-accent/40 p-4 text-sm text-muted-foreground"
        >
          For tracking and education only. Not medical advice. Titrra never
          recommends a dose change — the doses shown reflect common labelling,
          and your plan should always be set with your healthcare provider.
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Glp1DrugPage;
