import type { ReactNode } from 'react';
import EcosistemaLayout from '@/components/ecosistema/ecosistema-layout';

export default function EcosistemaRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <EcosistemaLayout>{children}</EcosistemaLayout>;
}
