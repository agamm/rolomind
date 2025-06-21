import { estimateTokenCount as tokenxEstimate } from 'tokenx';
import { Contact } from '@/types/contact';

// Token limits for each model/operation
export const TOKEN_LIMITS = {
  QUERY_CONTACTS: {
    input: 10000,
    output: 1000,
    model: 'claude-3.7-sonnet'
  },
  GENERATE_SUMMARY: {
    input: 1500,
    output: 200,
    model: 'claude-3.7-sonnet'
  },
  VOICE_TO_CONTACT: {
    input: 1000,
    output: 200,
    model: 'claude-3-haiku'
  },
  MERGE_CONTACTS: {
    input: 1500,
    output: 300,
    model: 'claude-3.7-sonnet'
  },
  PROCESS_RESULTS: {
    input: 2000,
    output: 100,
    model: 'claude-3.7-sonnet'
  },
  IMPORT_CONTACT: {
    input: 400,
    output: 100,
    model: 'claude-3-haiku'
  }
} as const;

export function estimateTokenCount(text: string): number {
  // Use tokenx with 3 characters per token default
  return tokenxEstimate(text, {
    defaultCharsPerToken: 3
  });
}

export function checkTokenLimit(text: string, limit: number, operation: string): void {
  const tokens = estimateTokenCount(text);
  if (tokens > limit) {
    throw new TokenLimitError(tokens, limit, operation);
  }
}

export class TokenLimitError extends Error {
  constructor(
    public tokens: number,
    public limit: number,
    public operation: string
  ) {
    super(`Token limit exceeded for ${operation}: ${tokens} tokens (limit: ${limit})`);
    this.name = 'TokenLimitError';
  }
}

// Estimate tokens for a batch of contacts
export function estimateContactBatchTokens(contacts: Contact[], includeFullDetails = true): number {
  if (!includeFullDetails) {
    // Simple estimation for contact count
    return contacts.length * 50; // ~50 tokens per contact summary
  }
  
  // Full contact details estimation
  const jsonString = JSON.stringify(contacts);
  return estimateTokenCount(jsonString);
}

// Calculate max contacts that can fit in token limit
export function calculateMaxContacts(
  sampleContact: Contact,
  tokenLimit: number,
  basePromptTokens: number = 300
): number {
  const sampleTokens = estimateTokenCount(JSON.stringify(sampleContact));
  const availableTokens = tokenLimit - basePromptTokens;
  return Math.floor(availableTokens / sampleTokens);
}

// Chunk contacts to fit within token limits
export function chunkContactsByTokenLimit(
  contacts: Contact[],
  tokenLimit: number,
  basePromptTokens: number = 300
): Contact[][] {
  const chunks: Contact[][] = [];
  let currentChunk: Contact[] = [];
  let currentTokens = basePromptTokens;
  
  for (const contact of contacts) {
    const contactTokens = estimateTokenCount(JSON.stringify(contact));
    
    if (currentTokens + contactTokens > tokenLimit && currentChunk.length > 0) {
      // Start a new chunk
      chunks.push(currentChunk);
      currentChunk = [contact];
      currentTokens = basePromptTokens + contactTokens;
    } else {
      // Add to current chunk
      currentChunk.push(contact);
      currentTokens += contactTokens;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Create batches with a safety margin (90% of limit)
export function createSafeBatches(
  contacts: Contact[],
  tokenLimit: number,
  basePromptTokens: number = 300,
  safetyMargin: number = 0.9
): Contact[][] {
  const safeLimit = Math.floor(tokenLimit * safetyMargin);
  return chunkContactsByTokenLimit(contacts, safeLimit, basePromptTokens);
}

// Batch generic items by token count
export function batchItemsByTokens<T>(
  items: T[],
  tokenLimit: number,
  itemToString: (item: T) => string,
  baseTokens: number = 0,
  safetyMargin: number = 0.9
): T[][] {
  const safeLimit = Math.floor(tokenLimit * safetyMargin);
  const batches: T[][] = [];
  let currentBatch: T[] = [];
  let currentTokens = baseTokens;
  
  for (const item of items) {
    const itemTokens = estimateTokenCount(itemToString(item));
    
    if (currentTokens + itemTokens > safeLimit && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [item];
      currentTokens = baseTokens + itemTokens;
    } else {
      currentBatch.push(item);
      currentTokens += itemTokens;
    }
  }
  
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  
  return batches;
}

// Get batch info for planning
export interface BatchInfo {
  totalBatches: number;
  itemsPerBatch: number[];
  tokensPerBatch: number[];
  totalTokens: number;
}

export function getBatchInfo<T>(
  items: T[],
  tokenLimit: number,
  itemToString: (item: T) => string,
  baseTokens: number = 0,
  safetyMargin: number = 0.9
): BatchInfo {
  const batches = batchItemsByTokens(items, tokenLimit, itemToString, baseTokens, safetyMargin);
  
  const tokensPerBatch = batches.map(batch => {
    const batchString = batch.map(itemToString).join('');
    return baseTokens + estimateTokenCount(batchString);
  });
  
  return {
    totalBatches: batches.length,
    itemsPerBatch: batches.map(b => b.length),
    tokensPerBatch,
    totalTokens: tokensPerBatch.reduce((sum, tokens) => sum + tokens, 0)
  };
}