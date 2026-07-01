// Sidebar navigation for the /infra product console. Single source of truth
// for the shared left sidebar across every infra product page.
export interface InfraNavItem { slug: string; title: string }
export interface InfraNavSection { title: string; items: InfraNavItem[] }

export const INFRA_NAV: InfraNavSection[] = [
  { title: 'Overview', items: [{ slug: '', title: 'All Infrastructure' }] },
  {
    title: 'Node',
    items: [
      { slug: 'explorer', title: 'Block Explorer' },
      { slug: 'lightning', title: 'Lightning' },
    ],
  },
  { title: 'Intelligence', items: [{ slug: 'mcp', title: 'MCP Server' }] },
  { title: 'Agents', items: [{ slug: 'agents', title: 'Agent Registry' }] },
  {
    title: 'Tools',
    items: [
      { slug: 'converter', title: 'Sats Converter' },
      { slug: 'dca', title: 'DCA Calculator' },
      { slug: 'time-machine', title: 'Time Machine' },
    ],
  },
];

export function infraHref(slug: string): string {
  return slug ? `/infra/${slug}` : '/infra';
}
