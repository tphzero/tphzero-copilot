import type { Metadata } from 'next';
import { HomePage } from '@/components/pages/home-page';

export const metadata: Metadata = {
  title: {
    absolute: 'Inicio | TPHZero Copilot',
  },
  description:
    'Carga datasets, revisa historiales y activa flujos de monitoreo para biorremediacion de suelos con TPHZero Copilot.',
};

export default function Page() {
  return <HomePage />;
}
