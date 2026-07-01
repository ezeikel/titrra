export type BlogTopic = { topic: string; category: string; keywords: string[] };
export type BlogAuthor = {
  name: string;
  slug: string;
  title: string;
  bio: string;
};

// The idempotency key is `topic`. Never rename an existing topic string — a
// rename un-covers it and the worker will regenerate a duplicate. Each unique
// `topic` maps to one future GLP-1 blog post.
export const BLOG_TOPICS: BlogTopic[] = [
  // Drug comparisons
  {
    topic: 'ozempic-vs-wegovy',
    category: 'Drug Comparisons',
    keywords: ['ozempic vs wegovy', 'semaglutide brands', 'glp-1 comparison'],
  },
  {
    topic: 'mounjaro-vs-ozempic',
    category: 'Drug Comparisons',
    keywords: [
      'mounjaro vs ozempic',
      'tirzepatide vs semaglutide',
      'glp-1 comparison',
    ],
  },
  {
    topic: 'zepbound-vs-wegovy',
    category: 'Drug Comparisons',
    keywords: [
      'zepbound vs wegovy',
      'tirzepatide weight loss',
      'glp-1 comparison',
    ],
  },
  {
    topic: 'rybelsus-vs-ozempic-pill-vs-injection',
    category: 'Drug Comparisons',
    keywords: ['rybelsus vs ozempic', 'oral semaglutide', 'glp-1 pill'],
  },
  // Side effects
  {
    topic: 'managing-glp1-nausea',
    category: 'Side Effects',
    keywords: [
      'glp-1 nausea',
      'ozempic nausea relief',
      'semaglutide side effects',
    ],
  },
  {
    topic: 'glp1-constipation-relief',
    category: 'Side Effects',
    keywords: [
      'glp-1 constipation',
      'ozempic constipation',
      'semaglutide digestion',
    ],
  },
  {
    topic: 'ozempic-fatigue-and-energy',
    category: 'Side Effects',
    keywords: ['ozempic fatigue', 'glp-1 tiredness', 'semaglutide energy'],
  },
  {
    topic: 'glp1-and-hair-loss',
    category: 'Side Effects',
    keywords: [
      'glp-1 hair loss',
      'ozempic hair thinning',
      'weight loss hair loss',
    ],
  },
  {
    topic: 'injection-site-reactions-glp1',
    category: 'Side Effects',
    keywords: [
      'injection site reaction',
      'ozempic injection bruise',
      'glp-1 skin',
    ],
  },
  // Injection sites
  {
    topic: 'glp1-injection-site-rotation',
    category: 'Injection Sites',
    keywords: [
      'injection site rotation',
      'where to inject ozempic',
      'glp-1 injection sites',
    ],
  },
  {
    topic: 'how-to-inject-glp1-step-by-step',
    category: 'Injection Sites',
    keywords: [
      'how to inject ozempic',
      'glp-1 injection technique',
      'semaglutide pen',
    ],
  },
  {
    topic: 'stomach-vs-thigh-vs-arm-injection',
    category: 'Injection Sites',
    keywords: [
      'ozempic injection site',
      'stomach vs thigh injection',
      'glp-1 where to inject',
    ],
  },
  // Titration
  {
    topic: 'glp1-titration-schedule-explained',
    category: 'Titration',
    keywords: [
      'glp-1 titration',
      'semaglutide dose escalation',
      'titration ladder',
    ],
  },
  {
    topic: 'why-titrate-glp1-slowly',
    category: 'Titration',
    keywords: [
      'glp-1 titration',
      'slow dose increase',
      'ozempic side effects titration',
    ],
  },
  {
    topic: 'what-to-do-if-you-miss-a-glp1-dose',
    category: 'Titration',
    keywords: [
      'missed ozempic dose',
      'glp-1 missed dose',
      'semaglutide schedule',
    ],
  },
  {
    topic: 'glp1-maintenance-dose-explained',
    category: 'Titration',
    keywords: [
      'glp-1 maintenance dose',
      'ozempic maintenance',
      'semaglutide target dose',
    ],
  },
  // Getting started
  {
    topic: 'what-to-eat-on-glp1',
    category: 'Getting Started',
    keywords: ['glp-1 diet', 'eating on ozempic', 'high protein glp-1'],
  },
  {
    topic: 'staying-hydrated-on-glp1',
    category: 'Getting Started',
    keywords: [
      'glp-1 hydration',
      'ozempic water intake',
      'semaglutide dehydration',
    ],
  },
  {
    topic: 'tracking-your-glp1-progress',
    category: 'Getting Started',
    keywords: [
      'glp-1 tracker',
      'ozempic progress',
      'weight loss shot tracking',
    ],
  },
  {
    topic: 'glp1-and-protein-goals',
    category: 'Getting Started',
    keywords: [
      'glp-1 protein',
      'protein on ozempic',
      'muscle loss weight loss shot',
    ],
  },
];

export const BLOG_AUTHORS: BlogAuthor[] = [
  {
    name: 'Titrra Team',
    slug: 'titrra-team',
    title: 'GLP-1 educator',
    bio: 'The Titrra team writes evidence-informed guides for people on GLP-1 medications. Educational only, not medical advice.',
  },
];

export function pickUncoveredTopic(
  covered: Set<string>,
  override?: string,
): BlogTopic | null {
  if (override) {
    return BLOG_TOPICS.find((t) => t.topic.includes(override)) ?? null;
  }
  const open = BLOG_TOPICS.filter((t) => !covered.has(t.topic));
  if (open.length === 0) return null;
  return open[Math.floor(Math.random() * open.length)];
}

export const pickRandomAuthor = (): BlogAuthor =>
  BLOG_AUTHORS[Math.floor(Math.random() * BLOG_AUTHORS.length)];
