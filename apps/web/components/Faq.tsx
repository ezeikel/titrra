const FAQS = [
  {
    q: 'Which medications does Titrra support?',
    a: 'All the common GLP-1 and dual-agonist treatments — Ozempic, Wegovy, Mounjaro, Zepbound, Rybelsus, and compounded semaglutide or tirzepatide — for both weekly injections and daily pills.',
  },
  {
    q: 'Is Titrra a calorie counter?',
    a: 'No, and that is the point. Titrra is built for the GLP-1 routine itself — the dose, the injection sites, the titration ladder and the side effects. It includes simple protein and water nudges for low-appetite days, but it is not another food-logging app.',
  },
  {
    q: 'Does Titrra give medical advice?',
    a: 'Never. Titrra is a tracking and education tool only. It does not diagnose, treat or recommend dose changes. Your titration ladder reflects the plan you and your provider set — always talk to your healthcare provider about any medication decision.',
  },
  {
    q: 'What is the injection-site rotation map?',
    a: 'Rotating injection sites is recommended best practice to avoid irritation and overuse. Titrra remembers where you last injected and suggests the next site automatically, so you do not have to keep track in your head.',
  },
  {
    q: 'How much does Titrra cost?',
    a: 'You can start free. Titrra Pro unlocks your full history, the titration ladder, the medication-level view and provider exports for one simple price — no confusing tiers, no weekly traps. Pricing is shown in-app before you ever pay.',
  },
  {
    q: 'Is my data private?',
    a: 'Your health data is yours. Titrra is built privacy-first, with your data encrypted in transit and at rest. You can request export or deletion at any time.',
  },
];

const Faq = () => (
  <section id="faq" className="border-y border-border bg-white">
    <div className="mx-auto max-w-3xl px-4 py-20 sm:py-24">
      <span className="eyebrow block text-center text-teal-deep">FAQ</span>
      <h2 className="font-heading mt-4 text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Questions, answered
      </h2>
      <div className="mt-12 divide-y divide-border">
        {FAQS.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-ink">
              {f.q}
              <span className="text-teal transition-transform group-open:rotate-45">
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export default Faq;
