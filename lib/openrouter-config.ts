import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { env } from '@/lib/env';

// Create OpenRouter provider instance
export const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
});