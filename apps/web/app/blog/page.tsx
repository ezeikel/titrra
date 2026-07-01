import { cacheLife, cacheTag } from 'next/cache';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { client, isSanityConfigured } from '@/lib/sanity/client';
import { allPostsQuery } from '@/lib/sanity/queries';
import { buildMetadata } from '@/lib/seo/metadata';

type PostCard = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  estimatedReadTime?: number;
  categories?: { title: string; slug: string }[];
};

export const generateMetadata = () =>
  buildMetadata({
    title: 'GLP-1 Guides & Education',
    description:
      'Evidence-informed guides on GLP-1 side effects, injection sites, titration, and drug comparisons — for the Ozempic, Wegovy, Mounjaro and Zepbound routine.',
    path: '/blog',
  });

async function getPosts(): Promise<PostCard[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('blog-list', 'blog-posts');
  if (!isSanityConfigured) return [];
  return client.fetch<PostCard[]>(allPostsQuery);
}

const BlogIndex = async () => {
  const posts = await getPosts();

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <SiteNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:py-24">
        <span className="eyebrow text-teal-deep">Guides &amp; education</span>
        <h1 className="font-heading mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          The Titrra GLP-1 guide
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Clear, evidence-informed reading on side effects, injection sites,
          titration, and how the treatments compare. Education only — not
          medical advice.
        </p>

        {posts.length === 0 ? (
          <p className="mt-16 text-muted-foreground">
            New guides are on the way. Check back soon.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {posts.map((p) => (
              <Link
                key={p._id}
                href={`/blog/${p.slug}`}
                className="group flex flex-col rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                {p.categories?.[0] ? (
                  <span className="text-[11px] font-bold uppercase tracking-[2px] text-teal">
                    {p.categories[0].title}
                  </span>
                ) : null}
                <h2 className="font-heading mt-2 text-xl font-bold text-ink group-hover:text-teal-deep">
                  {p.title}
                </h2>
                {p.excerpt ? (
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {p.excerpt}
                  </p>
                ) : null}
                {p.estimatedReadTime ? (
                  <span className="mt-4 text-xs text-muted-foreground">
                    {p.estimatedReadTime} min read
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default BlogIndex;
