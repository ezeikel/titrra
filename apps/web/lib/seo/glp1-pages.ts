// Config-array source for the programmatic GLP-1 SEO pages. The sitemap, the
// /glp-1/[drug] route, and metadata all consume these helpers. Content is
// education only — never prescriptive, always provider-consult framing (App
// Store Health compliance + Titrra CLAUDE.md).

export type Glp1Page = {
  slug: string; // URL segment, e.g. 'ozempic'
  label: string; // display name, e.g. 'Ozempic'
  generic: string; // e.g. 'semaglutide'
  form: 'injection' | 'pill';
  schedule: 'weekly' | 'daily';
  // Common labelled escalation ladder (mg), low → high. Shown as "the plan you
  // and your provider set", never as instructions.
  doses: number[];
  title: string; // <title> WITHOUT the '| Titrra' suffix
  description: string; // meta description
  intro: string; // on-page lede paragraph
  keywords: string[];
  faqs: { question: string; answer: string }[];
};

export const GLP1_PAGES: Glp1Page[] = [
  {
    slug: 'ozempic',
    label: 'Ozempic',
    generic: 'semaglutide',
    form: 'injection',
    schedule: 'weekly',
    doses: [0.25, 0.5, 1, 2],
    title: 'Ozempic Tracker — log doses, sites & titration',
    description:
      'Track your Ozempic (semaglutide) routine: log every weekly dose, rotate injection sites, follow your titration ladder, and record side effects and weight. Free to start.',
    intro:
      'Ozempic (semaglutide) is a once-weekly injection. Titrra keeps your whole routine in one calm place — the dose you took, where you injected, where you are on your titration ladder, and how you are feeling.',
    keywords: [
      'ozempic tracker',
      'ozempic dose tracker',
      'semaglutide tracker',
      'ozempic injection site tracker',
      'ozempic titration',
    ],
    faqs: [
      {
        question: 'How does Titrra track Ozempic doses?',
        answer:
          'Log each weekly injection in one tap. Titrra remembers your last dose and injection site, suggests the next site in your rotation, and shows where you are on your titration ladder. It never tells you what dose to take — that is between you and your provider.',
      },
      {
        question: 'What are the common Ozempic doses?',
        answer:
          'The common labelled escalation is 0.25 mg, 0.5 mg, 1 mg, then 2 mg, increased gradually. Your own plan may differ. Titrra shows the ladder you and your provider set — always confirm any change with your healthcare provider.',
      },
      {
        question: 'Can Titrra remind me when to inject?',
        answer:
          'Yes. Titrra can send a gentle weekly reminder so you never miss your shot, and it logs the dose and site the moment you tap.',
      },
    ],
  },
  {
    slug: 'wegovy',
    label: 'Wegovy',
    generic: 'semaglutide',
    form: 'injection',
    schedule: 'weekly',
    doses: [0.25, 0.5, 1, 1.7, 2.4],
    title: 'Wegovy Tracker — doses, injection sites & titration',
    description:
      'Track your Wegovy (semaglutide) routine: log every weekly dose, rotate injection sites, follow your titration ladder to 2.4 mg, and record side effects and weight. Free to start.',
    intro:
      'Wegovy (semaglutide) is a once-weekly injection that steps up to a 2.4 mg maintenance dose. Titrra keeps every dose, injection site, and titration step in one place, alongside your side effects and weight.',
    keywords: [
      'wegovy tracker',
      'wegovy dose tracker',
      'semaglutide tracker',
      'wegovy injection site tracker',
      'wegovy titration',
    ],
    faqs: [
      {
        question: 'How does Titrra track Wegovy doses?',
        answer:
          'Log each weekly injection in one tap. Titrra suggests your next injection site, records the dose, and shows your progress along the titration ladder. It is a tracking tool, not medical advice.',
      },
      {
        question: 'What are the common Wegovy doses?',
        answer:
          'The common labelled escalation is 0.25 mg, 0.5 mg, 1 mg, 1.7 mg, then 2.4 mg, increased gradually. Your plan may differ — Titrra reflects the ladder you set with your provider.',
      },
      {
        question: 'Does Titrra rotate my injection sites?',
        answer:
          'Yes. Rotating sites is recommended to avoid irritation. Titrra remembers where you last injected and suggests the next site automatically.',
      },
    ],
  },
  {
    slug: 'mounjaro',
    label: 'Mounjaro',
    generic: 'tirzepatide',
    form: 'injection',
    schedule: 'weekly',
    doses: [2.5, 5, 7.5, 10, 12.5, 15],
    title: 'Mounjaro Tracker — doses, sites & titration ladder',
    description:
      'Track your Mounjaro (tirzepatide) routine: log every weekly dose, rotate injection sites, follow your titration ladder to 15 mg, and record side effects and weight. Free to start.',
    intro:
      'Mounjaro (tirzepatide) is a once-weekly injection that escalates through six dose steps. Titrra keeps your dose, injection site, titration step, side effects and weight together in one calm view.',
    keywords: [
      'mounjaro tracker',
      'mounjaro dose tracker',
      'tirzepatide tracker',
      'mounjaro injection site tracker',
      'mounjaro titration',
    ],
    faqs: [
      {
        question: 'How does Titrra track Mounjaro doses?',
        answer:
          'Log each weekly injection in one tap. Titrra suggests your next injection site, records the dose, and shows your position on the titration ladder. It never recommends a dose change.',
      },
      {
        question: 'What are the common Mounjaro doses?',
        answer:
          'The common labelled escalation is 2.5 mg, 5 mg, 7.5 mg, 10 mg, 12.5 mg, then 15 mg, increased gradually. Your plan may differ — Titrra shows the ladder you and your provider set.',
      },
      {
        question: 'Can I track side effects and weight too?',
        answer:
          'Yes. Titrra logs side effects and weight alongside your doses, so you can see your whole GLP-1 journey in one place.',
      },
    ],
  },
  {
    slug: 'zepbound',
    label: 'Zepbound',
    generic: 'tirzepatide',
    form: 'injection',
    schedule: 'weekly',
    doses: [2.5, 5, 7.5, 10, 12.5, 15],
    title: 'Zepbound Tracker — doses, injection sites & titration',
    description:
      'Track your Zepbound (tirzepatide) routine: log every weekly dose, rotate injection sites, follow your titration ladder to 15 mg, and record side effects and weight. Free to start.',
    intro:
      'Zepbound (tirzepatide) is a once-weekly injection with six dose steps. Titrra keeps every dose, injection site, and titration step in one place, with your side effects and weight.',
    keywords: [
      'zepbound tracker',
      'zepbound dose tracker',
      'tirzepatide tracker',
      'zepbound injection site tracker',
      'zepbound titration',
    ],
    faqs: [
      {
        question: 'How does Titrra track Zepbound doses?',
        answer:
          'Log each weekly injection in one tap. Titrra suggests your next injection site, records the dose, and shows your titration progress. It is a tracking and education tool, not medical advice.',
      },
      {
        question: 'What are the common Zepbound doses?',
        answer:
          'The common labelled escalation is 2.5 mg, 5 mg, 7.5 mg, 10 mg, 12.5 mg, then 15 mg, increased gradually. Your plan may differ — always confirm changes with your provider.',
      },
      {
        question: 'Does Titrra work for both Zepbound and Mounjaro?',
        answer:
          'Yes. Both are tirzepatide with the same dose ladder, and Titrra supports either, plus Ozempic, Wegovy, Rybelsus and compounded versions.',
      },
    ],
  },
  {
    slug: 'rybelsus',
    label: 'Rybelsus',
    generic: 'oral semaglutide',
    form: 'pill',
    schedule: 'daily',
    doses: [3, 7, 14],
    title: 'Rybelsus Tracker — daily dose & titration',
    description:
      'Track your Rybelsus (oral semaglutide) routine: log your daily pill, follow your titration ladder to 14 mg, and record side effects and weight. Free to start.',
    intro:
      'Rybelsus (oral semaglutide) is a once-daily pill. Titrra keeps your daily dose, titration step, side effects and weight in one calm place — no injection sites to track, just a simple daily log.',
    keywords: [
      'rybelsus tracker',
      'rybelsus dose tracker',
      'oral semaglutide tracker',
      'rybelsus titration',
      'glp-1 pill tracker',
    ],
    faqs: [
      {
        question: 'How does Titrra track Rybelsus doses?',
        answer:
          'Log your daily pill in one tap. Titrra records the dose and shows your progress along the titration ladder. Because Rybelsus is oral, there are no injection sites to rotate.',
      },
      {
        question: 'What are the common Rybelsus doses?',
        answer:
          'The common labelled escalation is 3 mg, 7 mg, then 14 mg, increased gradually. Your plan may differ — Titrra reflects the ladder you set with your provider.',
      },
      {
        question: 'Can Titrra remind me to take my pill?',
        answer:
          'Yes. Titrra can send a gentle daily reminder so you keep your Rybelsus routine consistent.',
      },
    ],
  },
];

export const getGlp1PageSlugs = (): string[] => GLP1_PAGES.map((p) => p.slug);

export const getGlp1PageBySlug = (slug: string): Glp1Page | undefined =>
  GLP1_PAGES.find((p) => p.slug === slug);
