import StoreBadges from '@/components/StoreBadges';

// Copyright year as a build-time constant. Next 16 forbids `new Date()` during
// static prerender (current time isn't cacheable) in both Server and Client
// Components — see next-prerender-current-time. A footer year doesn't need to
// be per-request dynamic; it's stamped at build and refreshed on each deploy.
const COPYRIGHT_YEAR = 2026;

const SiteFooter = () => (
  <footer className="bg-sand">
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm font-semibold text-ink">Titrra</p>
      <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">
        For tracking and education only. Not medical advice. Titrra never
        recommends a dose change — always talk to your healthcare provider.
      </p>
      <StoreBadges placement="footer" className="mt-6" />
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <a href="/privacy" className="hover:text-foreground">
          Privacy
        </a>
        <a href="/terms" className="hover:text-foreground">
          Terms
        </a>
        <a href="mailto:hello@titrra.com" className="hover:text-foreground">
          Contact
        </a>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        © {COPYRIGHT_YEAR} Titrra. All rights reserved.
      </p>
    </div>
  </footer>
);

export default SiteFooter;
