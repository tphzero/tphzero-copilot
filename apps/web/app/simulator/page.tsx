import type { Metadata } from 'next';
import { SimulatorPage } from '@/components/pages/simulator-page';

export const metadata: Metadata = {
  title: 'Simulador',
  description:
    'Explora escenarios what-if para biopilas, compara curvas de TPH y estima impacto operativo con el simulador.',
};

export default function Page() {
  return <SimulatorPage />;
}
