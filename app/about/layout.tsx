import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Contrabxnd is a Bitcoin Intelligence Platform — live terminal, macro signals, education, and sovereign tools built for serious Bitcoiners.',
  openGraph: {
    title: 'About | Contrabxnd',
    description: 'Contrabxnd is a Bitcoin Intelligence Platform — live terminal, macro signals, education, and sovereign tools built for serious Bitcoiners.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
