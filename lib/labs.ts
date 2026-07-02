// Registry of which lessons ship an interactive "Live Lab" — a widget that
// talks to the live Bitcoin network (via the sovereign node proxy) as part of
// the lesson. This is the single source of truth used to:
//   • light up a "Live Lab" badge in the lesson header (LessonLayout)
//   • flag lessons with a lab in the course sidebar (lessonSidebarSections)
// Add a slug here when you embed a <Lab> into that lesson's page.

export const LAB_SLUGS: ReadonlySet<string> = new Set([
  'how-the-network-works',
  '21-million-the-number-that-changes-everything',
  'understanding-wallets',
  'sending-and-receiving',
  'the-seed-phrase-your-master-key',
  'the-road-to-self-custody',
]);

export function hasLab(slug: string): boolean {
  return LAB_SLUGS.has(slug);
}

/** Anchor id the header badge scrolls to; set on the <Lab> wrapper. */
export const LAB_ANCHOR = 'live-lab';
