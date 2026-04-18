import type { Metadata } from 'next';
import { NavigationContextError } from '@/components/errors/navigation-context-error';

export const metadata: Metadata = {
  title: 'Dashboard legado',
  description:
    'Vista legado del dashboard. Redirecciona el analisis operativo hacia los dashboards asociados a cada dataset.',
};

export default function LegacyDashboardPage() {
  return <NavigationContextError variant="obsolete" />;
}
