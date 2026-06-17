import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Boarding Pass — Bitcoin Basics Course',
  description: 'A 21-lesson free Bitcoin course. From "what is Bitcoin?" to self-custody, DCA, and your first wallet. No prior knowledge required.',
  openGraph: {
    title: 'The Boarding Pass | Contrabxnd',
    description: 'A 21-lesson free Bitcoin course. From "what is Bitcoin?" to self-custody and beyond.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
