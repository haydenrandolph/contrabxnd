// Navigation tree for the GitBook-style /docs section. Single source of truth
// for the sidebar; each leaf maps to an app/docs/<slug>/page.tsx.
export interface DocItem {
  slug: string; // '' = /docs index
  title: string;
}
export interface DocSection {
  title: string;
  items: DocItem[];
}

export const DOCS_NAV: DocSection[] = [
  {
    title: 'Getting Started',
    items: [
      { slug: '', title: 'Overview' },
      { slug: 'quickstart', title: 'Quickstart' },
    ],
  },
  {
    title: 'MCP Server',
    items: [
      { slug: 'mcp', title: 'Overview & Auth' },
      { slug: 'mcp/tools', title: 'Tool Reference' },
    ],
  },
  {
    title: 'Node & On-Chain',
    items: [
      { slug: 'node', title: 'Indexer & Explorer' },
      { slug: 'lightning', title: 'Lightning & L402' },
    ],
  },
  {
    title: 'Agents',
    items: [{ slug: 'agents', title: 'Agent Registry' }],
  },
];

/** Flattened, ordered list of doc pages for prev/next navigation. */
export const DOC_ORDER: DocItem[] = DOCS_NAV.flatMap((s) => s.items);

export function docHref(slug: string): string {
  return slug ? `/docs/${slug}` : '/docs';
}

export function adjacentDocs(slug: string): { prev: DocItem | null; next: DocItem | null } {
  const i = DOC_ORDER.findIndex((d) => d.slug === slug);
  return {
    prev: i > 0 ? DOC_ORDER[i - 1] : null,
    next: i >= 0 && i < DOC_ORDER.length - 1 ? DOC_ORDER[i + 1] : null,
  };
}
