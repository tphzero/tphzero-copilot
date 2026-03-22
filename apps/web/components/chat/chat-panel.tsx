'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { Bot, Send, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Cual es el estado actual de las biopilas?',
  'Analiza las anomalias de B1',
  'Cuanto falta para alcanzar 90% de reduccion en B2?',
  'Simula aumentar la humedad a 30% en B3',
];

function stringifyValue(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

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
            ? 'border-emerald-500/30 bg-emerald-500/10 text-zinc-100'
            : 'border-zinc-800 bg-zinc-900 text-zinc-100'
        )}
      >
        {children}
      </div>

      {isUser ? (
        <div className="mt-1 rounded-full bg-zinc-800 p-2 text-zinc-300">
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
        <p className="whitespace-pre-wrap text-sm leading-6">
          {typeof part.text === 'string' ? part.text : ''}
        </p>
      );

    case 'reasoning':
      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Razonamiento
          </p>
          <p className="whitespace-pre-wrap text-sm text-zinc-300">
            {typeof part.reasoning === 'string' ? part.reasoning : ''}
          </p>
        </div>
      );

    case 'tool-call':
      return (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300">
            Tool call
          </p>
          <p className="mt-2 text-sm font-medium text-amber-100">
            {typeof part.toolName === 'string' ? part.toolName : 'tool'}
          </p>
          {'args' in part ? (
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-amber-50/80">
              {stringifyValue(part.args)}
            </pre>
          ) : null}
        </div>
      );

    case 'tool-result':
      return (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-300">
            Tool result
          </p>
          <p className="mt-2 text-sm font-medium text-blue-100">
            {typeof part.toolName === 'string' ? part.toolName : 'tool'}
          </p>
          {'result' in part ? (
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-blue-50/80">
              {stringifyValue(part.result)}
            </pre>
          ) : null}
        </div>
      );

    default:
      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {partType || 'Parte no renderizada'}
          </p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-zinc-300">
            {stringifyValue(part)}
          </pre>
        </div>
      );
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
            <p className="mt-4 text-lg font-medium text-zinc-300">TPHZero Copilot</p>
            <p className="mt-1 max-w-md text-sm text-zinc-500">
              Preguntame sobre el estado de tus biopilas, pedi predicciones,
              recomendaciones o simula escenarios.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
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
            <p className="text-sm text-zinc-500">Analizando...</p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-zinc-800 bg-zinc-950/80 p-4 backdrop-blur">
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
            className="min-h-[44px] max-h-32 resize-none border-zinc-700 bg-zinc-900"
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
