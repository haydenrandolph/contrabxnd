// Single source of truth for the Boarding Pass course.
//
// Previously every lesson page hard-coded its own number, week, duration,
// progress-bar width and prev/next links, and the course index hard-coded a
// parallel copy of the same list. That duplication drifted. Everything the
// lessons and the course index need is now derived from the data below.

export interface Lesson {
  /** 1-based position in the course (1..21). */
  order: number;
  /** Zero-padded label, e.g. "01". */
  number: string;
  slug: string;
  title: string;
  /** Short blurb shown in the curriculum list on the course index. */
  description: string;
  /** Italic subtitle shown in the lesson header (defaults to description). */
  subtitle: string;
  /** Reading time without the "read" suffix, e.g. "12 min". */
  duration: string;
  /** Week number this lesson belongs to (1..3). */
  week: number;
}

export interface CourseWeek {
  number: number;
  /** e.g. "Week 1". */
  label: string;
  title: string;
  lessons: Lesson[];
}

export const COURSE = {
  slug: 'boarding-pass',
  href: '/learn/boarding-pass',
  label: 'Course 01 · Beginner',
  title: 'The Boarding Pass',
  tagline: 'Your first 21 days with Bitcoin',
  description:
    'Everything you need to understand Bitcoin and make your first moves. No jargon, no hype, no scams. Just clear explanations from first principles—21 lessons for the 21 million.',
  level: 'Beginner',
  weekTitles: {
    1: 'Understanding Bitcoin',
    2: 'Getting Started',
    3: 'Thinking Long-Term',
  } as Record<number, string>,
  outcomes: [
    'What Bitcoin actually is—the technology, the network, and why it matters',
    'Why 21 million is the number that changes everything',
    'How to buy Bitcoin safely without getting scammed',
    'The difference between custodial and self-custody wallets',
    'How to spot scams, shitcoins, and bad advice',
    'The philosophical case for Bitcoin as freedom technology',
  ],
};

// Authored in course order. `subtitle` defaults to `description`; set it
// explicitly only where the lesson header copy differs from the curriculum
// blurb.
const RAW_LESSONS: Array<Omit<Lesson, 'order' | 'number' | 'subtitle'> & { subtitle?: string }> = [
  { week: 1, slug: 'what-is-bitcoin-actually', title: 'What Is Bitcoin, Actually?', description: "Forget what you've heard. Let's start from zero.", duration: '12 min' },
  { week: 1, slug: 'the-problem-bitcoin-solves', title: 'The Problem Bitcoin Solves', description: 'Digital scarcity and the double-spend problem.', duration: '15 min' },
  { week: 1, slug: '21-million-the-number-that-changes-everything', title: '21 Million: The Number That Changes Everything', description: "Why Bitcoin's fixed supply is its superpower.", duration: '14 min' },
  { week: 1, slug: 'how-the-network-works', title: 'How the Network Works', description: 'Nodes, miners, and the blockchain—demystified.', duration: '18 min' },
  { week: 1, slug: 'bitcoin-vs-crypto', title: 'Bitcoin vs. "Crypto"', description: 'Why Bitcoin is different and why that matters.', duration: '12 min' },
  { week: 1, slug: 'a-brief-history-2008-to-now', title: 'A Brief History: 2008 to Now', description: 'From cypherpunks to institutional adoption.', duration: '16 min' },
  { week: 1, slug: 'the-philosophy-why-this-exists', title: 'The Philosophy: Why This Exists', description: 'Freedom, sovereignty, and opting out.', duration: '14 min' },
  { week: 2, slug: 'ways-to-acquire-bitcoin', title: 'Ways to Acquire Bitcoin', description: 'Exchanges, P2P, earning, and more.', duration: '15 min' },
  { week: 2, slug: 'choosing-an-exchange', title: 'Choosing an Exchange', description: 'What to look for and what to avoid.', duration: '12 min' },
  { week: 2, slug: 'your-first-purchase', title: 'Your First Purchase', description: 'Step-by-step: buying your first sats.', duration: '10 min' },
  { week: 2, slug: 'understanding-wallets', title: 'Understanding Wallets', description: 'Hot, cold, custodial, non-custodial—explained.', duration: '16 min' },
  { week: 2, slug: 'your-first-wallet', title: 'Your First Wallet', description: 'Setting up a mobile wallet for beginners.', duration: '12 min' },
  { week: 2, slug: 'sending-and-receiving', title: 'Sending and Receiving', description: 'Addresses, transactions, and fees.', duration: '14 min' },
  { week: 2, slug: 'the-seed-phrase-your-master-key', title: 'The Seed Phrase: Your Master Key', description: 'What it is, why it matters, how to protect it.', duration: '15 min' },
  { week: 3, slug: 'dca-the-boring-strategy-that-works', title: 'DCA: The Boring Strategy That Works', description: 'Why time in the market beats timing the market.', duration: '12 min' },
  { week: 3, slug: 'volatility-feature-not-bug', title: 'Volatility: Feature, Not Bug', description: 'How to think about price swings.', duration: '14 min' },
  { week: 3, slug: 'common-scams-and-how-to-avoid-them', title: 'Common Scams and How to Avoid Them', description: 'If it sounds too good to be true...', duration: '16 min' },
  { week: 3, slug: 'shitcoins-why-bitcoin-only', title: 'Shitcoins: Why Bitcoin Only', description: 'The case for focus over diversification.', duration: '15 min' },
  { week: 3, slug: 'bitcoin-and-taxes', title: 'Bitcoin and Taxes', description: 'What you need to know (and track).', subtitle: 'What you need to know (but ask a professional).', duration: '12 min' },
  { week: 3, slug: 'the-road-to-self-custody', title: 'The Road to Self-Custody', description: 'Why you should take your coins off the exchange.', duration: '14 min' },
  { week: 3, slug: 'whats-next-your-sovereign-journey', title: "What's Next: Your Sovereign Journey", description: 'Where to go from here.', duration: '10 min' },
];

export const LESSONS: Lesson[] = RAW_LESSONS.map((lesson, index) => ({
  ...lesson,
  order: index + 1,
  number: String(index + 1).padStart(2, '0'),
  subtitle: lesson.subtitle ?? lesson.description,
}));

export const TOTAL_LESSONS = LESSONS.length;

export const WEEKS: CourseWeek[] = Object.values(COURSE.weekTitles)
  .map((title, i) => {
    const number = i + 1;
    return {
      number,
      label: `Week ${number}`,
      title,
      lessons: LESSONS.filter((l) => l.week === number),
    };
  })
  .filter((w) => w.lessons.length > 0);

export function getLessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

/** Sidebar sections for the GitBook shell: weeks → lessons. */
export function lessonSidebarSections(activeSlug: string) {
  return WEEKS.map((w) => ({
    title: `${w.label} · ${w.title}`,
    items: w.lessons.map((l) => ({
      title: `${l.number} · ${l.title}`,
      href: `${COURSE.href}/${l.slug}`,
      active: l.slug === activeSlug,
    })),
  }));
}

export interface LessonNavLink {
  href: string;
  label: string;
}

export interface LessonNav {
  lesson: Lesson;
  total: number;
  /** Progress through the course as a percentage, e.g. 4.76. */
  progress: number;
  weekLabel: string;
  prev: LessonNavLink;
  next: LessonNavLink;
}

export function getLessonNav(slug: string): LessonNav | undefined {
  const lesson = getLessonBySlug(slug);
  if (!lesson) return undefined;

  const total = LESSONS.length;
  const prevLesson = LESSONS[lesson.order - 2];
  const nextLesson = LESSONS[lesson.order];

  const prev: LessonNavLink = prevLesson
    ? { href: `${COURSE.href}/${prevLesson.slug}`, label: `Lesson ${lesson.order - 1}` }
    : { href: COURSE.href, label: 'Course Overview' };

  const next: LessonNavLink = nextLesson
    ? { href: `${COURSE.href}/${nextLesson.slug}`, label: `Lesson ${lesson.order + 1}` }
    : { href: COURSE.href, label: 'Course Overview' };

  return {
    lesson,
    total,
    progress: (lesson.order / total) * 100,
    weekLabel: `Week ${lesson.week}`,
    prev,
    next,
  };
}
