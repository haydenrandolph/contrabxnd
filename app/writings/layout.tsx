import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Writings',
  description: 'Essays, analysis, and ideas on Bitcoin, markets, and the monetary system. Long-form writing from the Contrabxnd desk.',
  openGraph: {
    title: 'Writings | Contrabxnd',
    description: 'Essays, analysis, and ideas on Bitcoin, markets, and the monetary system.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
