import { PortableText, type PortableTextComponents } from '@portabletext/react';
import { format } from 'date-fns';
import { cacheLife, cacheTag } from 'next/cache';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { client, isSanityConfigured } from '@/lib/sanity/client';
import { urlFor } from '@/lib/sanity/image';
import { postBySlugQuery, postSlugsQuery } from '@/lib/sanity/queries';
import { buildMetadata } from '@/lib/seo/metadata';
import { articleSchema, breadcrumbSchema } from '@/lib/seo/schema';
import { siteUrl } from '@/lib/site';

type Post = any;

// Cache Components requires generateStaticParams to return ≥1 entry. When
// Sanity is unconfigured (CI / preview without env) or has no posts yet, return
// a sentinel slug that resolves to notFound() — it never renders a real page,
// it just satisfies the build-time validator.
const PLACEHOLDER_SLUG = '__no_posts__';

export async function generateStaticParams() {
  if (!isSanityConfigured) return [{ slug: PLACEHOLDER_SLUG }];
  const slugs = await client.fetch<string[]>(postSlugsQuery);
  if (slugs.length === 0) return [{ slug: PLACEHOLDER_SLUG }];
  return slugs.map((slug) => ({ slug }));
}

async function getPost(slug: string): Promise<Post | null> {
  'use cache';
  cacheLife('hours');
  cacheTag('blog-posts', `blog-post-${slug}`);
  if (!isSanityConfigured || slug === PLACEHOLDER_SLUG) return null;
  return client.fetch(postBySlugQuery, { slug });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return buildMetadata({ title: 'Post not found', noindex: true });
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    ogType: 'article',
    keywords: post.seoKeywords,
    publishedTime: post.publishedAt,
    authors: post.author?.name ? [post.author.name] : undefined,
    tags: post.categories?.map((c: { title: string }) => c.title),
    // The route's own opengraph-image.tsx (dynamic per-post card) wins.
    noDefaultOgImage: true,
  });
}

const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({ value }) =>
      value?.asset?._ref ? (
        <figure className="my-8">
          <Image
            src={urlFor(value).width(1200).height(675).url()}
            alt={value.alt ?? ''}
            width={1200}
            height={675}
            className="rounded-2xl"
          />
          {value.caption ? (
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
              {value.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null,
  },
  block: {
    h2: ({ children }) => (
      <h2 className="font-heading mt-10 text-2xl font-bold text-ink">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-heading mt-8 text-xl font-semibold text-ink">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-6 text-lg font-semibold text-ink">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-teal pl-4 italic text-ink/90">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="mt-4 leading-7 text-ink/90">{children}</p>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 list-disc space-y-1 pl-6 text-ink/90">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 list-decimal space-y-1 pl-6 text-ink/90">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ value, children }) => {
      const href = value?.href ?? '#';
      return href.startsWith('http') ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-deep underline"
        >
          {children}
        </a>
      ) : (
        <Link href={href} className="text-teal-deep underline">
          {children}
        </Link>
      );
    },
  },
};

const BlogPost = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const url = siteUrl(`/blog/${slug}`);
  const image = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : undefined;

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <JsonLd
        data={articleSchema({
          title: post.title,
          description: post.excerpt,
          url,
          datePublished: post.publishedAt,
          dateModified: post._updatedAt ?? post.publishedAt,
          authorName: post.author?.name,
          image,
          keywords: post.seoKeywords,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Blog', url: siteUrl('/blog') },
          { name: post.title, url },
        ])}
      />

      <SiteNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <article>
          {post.categories?.[0] ? (
            <span className="text-[11px] font-bold uppercase tracking-[2px] text-teal">
              {post.categories[0].title}
            </span>
          ) : null}
          <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            {post.author?.name ? <span>{post.author.name}</span> : null}
            {post.publishedAt ? (
              <>
                <span>·</span>
                <time dateTime={post.publishedAt}>
                  {format(new Date(post.publishedAt), 'd MMM yyyy')}
                </time>
              </>
            ) : null}
            {post.estimatedReadTime ? (
              <>
                <span>·</span>
                <span>{post.estimatedReadTime} min read</span>
              </>
            ) : null}
          </div>

          {post.mainImage ? (
            <Image
              src={urlFor(post.mainImage).width(1200).height(630).url()}
              alt={post.mainImage.alt ?? post.title}
              width={1200}
              height={630}
              className="mt-8 rounded-3xl"
              priority
            />
          ) : null}

          <div className="mt-8">
            <PortableText
              value={post.body}
              components={portableTextComponents}
            />
          </div>

          {/* Mandatory compliance disclaimer — every post, always visible. */}
          <aside
            role="note"
            className="mt-12 rounded-2xl border border-mist bg-accent/40 p-4 text-sm text-muted-foreground"
          >
            This article is for general education only and is not medical
            advice. GLP-1 medications, dosing, and titration decisions must be
            made with a qualified healthcare provider. Do not change your dose
            based on this content.
          </aside>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
};

export default BlogPost;
