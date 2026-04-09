import { google } from '@ai-sdk/google';
import { createOllama, ollama } from 'ai-sdk-ollama';

const useOllama = process.env.AI_PROVIDER === 'ollama';

/**
 * Ollama local vía ai-sdk-ollama (mejor comportamiento con tools + síntesis si el modelo
 * no devuelve texto tras ejecutar herramientas). Ver OLLAMA_MODEL en .env.
 */
function ollamaChatModel(modelId: string) {
  const baseURL = process.env.OLLAMA_BASE_URL;
  const provider = baseURL ? createOllama({ baseURL }) : ollama;
  return provider(modelId);
}

/** Gemini en la nube o modelo Ollama local según AI_PROVIDER */
export const MODEL_ID = useOllama
  ? (process.env.OLLAMA_MODEL ?? 'qwen2.5:7b')
  : 'gemini-2.5-flash';

export const chatModel = useOllama
  ? ollamaChatModel(MODEL_ID)
  : google(MODEL_ID);
