// Single source of truth for the landing FAQ — consumed by both the visible
// <Faq> accordion and the FAQPage JSON-LD (lib/seo/schema.ts faqSchema).
export type Faq = { question: string; answer: string };

export const FAQS: Faq[] = [
  {
    question: 'Which medications does Titrra support?',
    answer:
      'All the common GLP-1 and dual-agonist treatments — Ozempic, Wegovy, Mounjaro, Zepbound, Rybelsus, and compounded semaglutide or tirzepatide — for both weekly injections and daily pills.',
  },
  {
    question: 'Is Titrra a calorie counter?',
    answer:
      'No, and that is the point. Titrra is built for the GLP-1 routine itself — the dose, the injection sites, the titration ladder and the side effects. It includes simple protein and water nudges for low-appetite days, but it is not another food-logging app.',
  },
  {
    question: 'Does Titrra give medical advice?',
    answer:
      'Never. Titrra is a tracking and education tool only. It does not diagnose, treat or recommend dose changes. Your titration ladder reflects the plan you and your provider set — always talk to your healthcare provider about any medication decision.',
  },
  {
    question: 'What is the injection-site rotation map?',
    answer:
      'Rotating injection sites is recommended best practice to avoid irritation and overuse. Titrra remembers where you last injected and suggests the next site automatically, so you do not have to keep track in your head.',
  },
  {
    question: 'How much does Titrra cost?',
    answer:
      'You can start free. Titrra Pro unlocks your full history, the titration ladder, the medication-level view and provider exports for one simple price — no confusing tiers, no weekly traps. Pricing is shown in-app before you ever pay.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Your health data is yours. Titrra is built privacy-first, with your data encrypted in transit and at rest. You can request export or deletion at any time.',
  },
];
