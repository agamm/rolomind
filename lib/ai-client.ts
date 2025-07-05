import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { getUserApiKeys } from '@/lib/auth/server';

export async function getAIModel(modelName: string, useOpenAI: boolean = false) {
  const apiKeys = await getUserApiKeys();
  
  if (!apiKeys) {
    throw new Error('User not authenticated');
  }

  if (useOpenAI) {
    if (!apiKeys.openaiApiKey) {
      throw new Error('OpenAI API key not configured. AI features require your own API keys. Please configure your OpenAI API key in Settings > AI Keys to enable voice transcription features.');
    }
    
    const client = createOpenAI({
      apiKey: apiKeys.openaiApiKey,
    });
    
    return client(modelName);
  } else {
    if (!apiKeys.openrouterApiKey) {
      throw new Error('OpenRouter API key not configured. AI features require your own API keys. Please configure your OpenRouter API key in Settings > AI Keys to enable AI-powered contact search, merging, and processing.');
    }
    
    const client = createOpenRouter({
      apiKey: apiKeys.openrouterApiKey,
    });
    
    return client(modelName);
  }
}

export async function getAIClient(useOpenAI: boolean = false) {
  const apiKeys = await getUserApiKeys();
  
  if (!apiKeys) {
    throw new Error('User not authenticated');
  }

  if (useOpenAI) {
    if (!apiKeys.openaiApiKey) {
      throw new Error('OpenAI API key not configured. AI features require your own API keys. Please configure your OpenAI API key in Settings > AI Keys to enable voice transcription features.');
    }
    
    const client = createOpenAI({
      apiKey: apiKeys.openaiApiKey,
    });
    return {
      transcription: (model: string) => client.transcription(model)
    };
  } else {
    if (!apiKeys.openrouterApiKey) {
      throw new Error('OpenRouter API key not configured. AI features require your own API keys. Please configure your OpenRouter API key in Settings > AI Keys to enable AI-powered contact search, merging, and processing.');
    }
    
    return createOpenRouter({
      apiKey: apiKeys.openrouterApiKey,
    });
  }
}