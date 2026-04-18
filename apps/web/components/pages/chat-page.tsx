'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatPanel } from '@/components/chat/chat-panel';
import { useActiveDataset } from '@/lib/context/dataset-context';

export function ChatPage() {
  const router = useRouter();
  const { activeDataset } = useActiveDataset();

  useEffect(() => {
    if (!activeDataset) {
      router.replace('/');
    }
  }, [activeDataset, router]);

  if (!activeDataset) {
    return null;
  }

  return (
    <div className="h-full min-h-0">
      <ChatPanel />
    </div>
  );
}
