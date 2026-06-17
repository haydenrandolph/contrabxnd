import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stu₿y',
  description: 'Free Bitcoin education courses — from first purchase to self-custody. Learn at your own pace with The Boarding Pass and Letters of Marque.',
  openGraph: {
    title: 'Stu₿y | Contrabxnd',
    description: 'Free Bitcoin education courses — from first purchase to self-custody.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
