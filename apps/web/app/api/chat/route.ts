import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';
import { chatModel } from '@/lib/ai/model';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { aiTools } from '@/lib/ai/tools';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: chatModel,
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools: aiTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
