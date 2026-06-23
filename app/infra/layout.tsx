import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Infra',
  description: 'Bitcoin infrastructure — tools, agent registry, MCP server, APIs, and intelligence services.',
  openGraph: {
    title: 'Infra | Contrabxnd',
    description: 'Bitcoin infrastructure — tools, agent registry, MCP server, APIs, and intelligence services.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
