import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Merchant Network',
  description: 'Bitcoin-accepting businesses worldwide. Browse the Contrabxnd merchant directory and find places to spend sats.',
  openGraph: {
    title: 'Merchant Network | Contrabxnd',
    description: 'Bitcoin-accepting businesses worldwide. Browse the Contrabxnd merchant directory.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
