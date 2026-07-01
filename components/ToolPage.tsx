'use client';

import { ReactNode } from 'react';
import InfraShell from '@/components/infra/InfraShell';

/**
 * Thin wrapper for infra tool pages — renders inside the shared InfraShell
 * (sidebar console) with the tool framed in a bordered surface card.
 */
export default function ToolPage({
  slug,
  title,
  subtitle,
  children,
}: {
  slug: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <InfraShell slug={slug} title={title} subtitle={subtitle} framed>
      {children}
    </InfraShell>
  );
}
