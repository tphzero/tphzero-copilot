'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { Bot, Send, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Cual es el estado actual de las biopilas?',
  'Analiza las anomalias de B1',
  'Cuanto falta para alcanzar 90% de reduccion en B2?',
  'Simula aumentar la humedad a 30% en B3',
];


function MessageBubble({
  role,
  children,
}: {
  role: 'user' | 'assistant';
  children: React.ReactNode;
}) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser ? (
        <div className="mt-1 rounded-full bg-emerald-500/20 p-2 text-emerald-400">
          <Bot className="h-4 w-4" />
        </div>
      ) : null}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl border px-4 py-3',
          isUser
            ? 'border-emerald-500/30 bg-emerald-500/10 text-foreground'
            : 'border-border bg-card text-foreground'
        )}
      >
        {children}
      </div>

      {isUser ? (
        <div className="mt-1 rounded-full bg-muted p-2 text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );
}

function RenderPart({ part }: { part: Record<string, unknown> }) {
  const partType = typeof part.type === 'string' ? part.type : '';

  switch (partType) {
    case 'text':
      return (
        <div className="prose prose-sm prose-invert max-w-none text-sm leading-6 [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:ml-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {typeof part.text === 'string' ? part.text : ''}
          </ReactMarkdown>
        </div>
      );

    case 'reasoning':
      return (
        <div className="rounded-xl border border-border bg-background/70 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Razonamiento
          </p>
          <p className="whitespace-pre-wrap text-sm text-foreground/85">
            {typeof part.reasoning === 'string' ? part.reasoning : ''}
          </p>
        </div>
      );

    default:
      return null;
  }
}

export function ChatPanel() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
      }),
    []
  );

  const { messages, sendMessage, status } = useChat({
    transport,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="h-12 w-12 text-emerald-400/30" />
            <p className="mt-4 text-lg font-medium text-foreground/85">TPHZero Copilot</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Preguntame sobre el estado de tus biopilas, pedi predicciones,
              recomendaciones o simula escenarios.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role === 'user' ? 'user' : 'assistant'}
          >
            <div className="space-y-3">
              {message.parts.map((part, index) => (
                <RenderPart
                  key={`${message.id}-${index}`}
                  part={part as Record<string, unknown>}
                />
              ))}
            </div>
          </MessageBubble>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' ? (
          <div className="flex gap-3">
            <div className="mt-1 rounded-full bg-emerald-500/20 p-2 text-emerald-400">
              <Bot className="h-4 w-4 animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Analizando...</p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border bg-background/80 p-4 backdrop-blur">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escribe tu pregunta..."
            className="min-h-[44px] max-h-32 resize-none border-border bg-card"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
