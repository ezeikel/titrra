const SiteFooter = () => (
  <footer className="bg-sand">
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-sm font-semibold text-ink">Titrra</p>
      <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">
        For tracking and education only. Not medical advice. Titrra never
        recommends a dose change — always talk to your healthcare provider.
      </p>
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
        © {new Date().getFullYear()} Chewy Bytes. All rights reserved.
      </p>
    </div>
  </footer>
);

export default SiteFooter;
