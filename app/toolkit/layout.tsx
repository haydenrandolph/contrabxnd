import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tool₿ox',
  description: 'Bitcoin tools — Sats Converter, DCA Calculator, Time Machine, and MCP Server. Calculate, convert, compare, and build.',
  openGraph: {
    title: 'Tool₿ox | Contrabxnd',
    description: 'Bitcoin tools — Sats Converter, DCA Calculator, Time Machine, and MCP Server.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
