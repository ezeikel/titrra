import { FAQS } from '@/lib/faq-data';

const Faq = () => (
  <section id="faq" className="border-y border-border bg-white">
    <div className="mx-auto max-w-3xl px-4 py-20 sm:py-24">
      <span className="eyebrow block text-center text-teal-deep">FAQ</span>
      <h2 className="font-heading mt-4 text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Questions, answered
      </h2>
      <div className="mt-12 divide-y divide-border">
        {FAQS.map((f) => (
          <details key={f.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-ink">
              {f.question}
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
              {f.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export default Faq;
