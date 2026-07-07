const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '#faq', label: 'FAQ' },
];

const SiteNav = () => (
  <header className="sticky top-0 z-50 border-b border-border/60 bg-sand/80 backdrop-blur">
    <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <a href="/" className="flex items-center gap-2" aria-label="Titrra home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.png"
          alt=""
          width={28}
          height={28}
          className="size-7 rounded-lg"
        />
        <span className="text-lg font-bold tracking-tight text-ink">
          Titrra
        </span>
      </a>
      <div className="hidden items-center gap-7 sm:flex">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-sm font-medium text-muted-foreground transition hover:text-ink"
          >
            {l.label}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-4">
        {/* Anonymous-first: Titrra works without an account, but the link is
            always here so you can sign in to sync across devices. */}
        <a
          href="/signin"
          className="text-sm font-medium text-muted-foreground transition hover:text-ink"
        >
          Sign in
        </a>
        <a
          href="#top"
          className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-deep"
        >
          Get the app
        </a>
      </div>
    </nav>
  </header>
);

export default SiteNav;
