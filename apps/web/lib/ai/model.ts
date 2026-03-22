import { google } from '@ai-sdk/google';

export const MODEL_ID = 'gemini-2.5-flash';

export const chatModel = google(MODEL_ID);
