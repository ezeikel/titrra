// Config-array source for the programmatic GLP-1 SEO pages (Phase E). The
// sitemap, route (app/glp-1/[drug]), and metadata all consume these helpers, so
// Phase E is a drop-in: populate GLP1_PAGES and the pages + sitemap entries
// appear. Kept empty here so the plumbing (sitemap/metadata) compiles today.

export type Glp1Page = {
  slug: string; // URL segment, e.g. 'ozempic'
  label: string; // display name, e.g. 'Ozempic'
  drug: string; // generic, e.g. 'semaglutide'
  title: string; // <title> WITHOUT the '| Titrra' suffix
  description: string; // meta description
  keywords: string[];
  faqs: { question: string; answer: string }[]; // → faqSchema()
};

export const GLP1_PAGES: Glp1Page[] = [];

export const getGlp1PageSlugs = (): string[] => GLP1_PAGES.map((p) => p.slug);

export const getGlp1PageBySlug = (slug: string): Glp1Page | undefined =>
  GLP1_PAGES.find((p) => p.slug === slug);
