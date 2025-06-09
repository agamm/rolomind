import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// Create OpenRouter provider instance
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});