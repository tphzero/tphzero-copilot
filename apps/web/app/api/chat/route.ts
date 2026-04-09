import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';
import { streamText as streamTextOllama } from 'ai-sdk-ollama';
import { chatModel } from '@/lib/ai/model';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { aiTools } from '@/lib/ai/tools';

export const maxDuration = 30;

const useOllama = process.env.AI_PROVIDER === 'ollama';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const options = {
    model: chatModel,
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools: aiTools,
    stopWhen: stepCountIs(5),
  };

  const result = useOllama
    ? await streamTextOllama(options)
    : streamText(options);

  return result.toUIMessageStreamResponse();
}
