import type { Metadata } from 'next';
import { ChatPage } from '@/components/pages/chat-page';

export const metadata: Metadata = {
  title: 'Chat',
  description:
    'Consulta recomendaciones operativas y analiza datasets activos con el asistente de TPHZero Copilot.',
};

export default function Page() {
  return <ChatPage />;
}
