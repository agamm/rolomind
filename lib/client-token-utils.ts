import { 
  TOKEN_LIMITS, 
  estimateTokenCount, 
  chunkContactsByTokenLimit
} from './config';
import { Contact } from '@/types/contact';

// Re-export batching utilities from config
export { 
  createSafeBatches,
  batchItemsByTokens
} from './config';

// Additional utility types and functions
export interface BatchInfo {
  totalBatches: number;
  itemsPerBatch: number[];
  estimatedTokensPerBatch: number[];
}

export function getBatchInfo<T>(
  batches: T[][],
  itemToString: (item: T) => string
): BatchInfo {
  return {
    totalBatches: batches.length,
    itemsPerBatch: batches.map(batch => batch.length),
    estimatedTokensPerBatch: batches.map(batch => 
      batch.reduce((sum, item) => sum + estimateTokenCount(itemToString(item)), 0)
    )
  };
}

export interface TokenCheckResult {
  isValid: boolean;
  estimatedTokens: number;
  tokenLimit: number;
  needsChunking: boolean;
  chunks?: Contact[][];
  maxContacts?: number;
  error?: string;
}

// Check if query-contacts request will fit in token limit
export function checkQueryContactsTokens(
  query: string,
  contacts: Contact[]
): TokenCheckResult {
  const basePrompt = 300; // Base prompt tokens
  const queryTokens = estimateTokenCount(query);
  const contactsTokens = estimateTokenCount(JSON.stringify(contacts));
  const totalTokens = basePrompt + queryTokens + contactsTokens;
  
  if (totalTokens <= TOKEN_LIMITS.QUERY_CONTACTS.input) {
    return {
      isValid: true,
      estimatedTokens: totalTokens,
      tokenLimit: TOKEN_LIMITS.QUERY_CONTACTS.input,
      needsChunking: false
    };
  }
  
  // Calculate chunks if needed
  const chunks = chunkContactsByTokenLimit(
    contacts,
    TOKEN_LIMITS.QUERY_CONTACTS.input,
    basePrompt + queryTokens
  );
  
  return {
    isValid: false,
    estimatedTokens: totalTokens,
    tokenLimit: TOKEN_LIMITS.QUERY_CONTACTS.input,
    needsChunking: true,
    chunks,
    maxContacts: Math.floor((TOKEN_LIMITS.QUERY_CONTACTS.input - basePrompt - queryTokens) / (contactsTokens / contacts.length)),
    error: `Query would use ${totalTokens} tokens, but limit is ${TOKEN_LIMITS.QUERY_CONTACTS.input}. Please process in ${chunks.length} batches.`
  };
}

// Check if generate-summary request will fit in token limit
export function checkGenerateSummaryTokens(
  query: string,
  contacts: unknown[]
): TokenCheckResult {
  const basePrompt = 200;
  const queryTokens = estimateTokenCount(query);
  const contactsTokens = estimateTokenCount(JSON.stringify(contacts));
  const totalTokens = basePrompt + queryTokens + contactsTokens;
  
  return {
    isValid: totalTokens <= TOKEN_LIMITS.GENERATE_SUMMARY.input,
    estimatedTokens: totalTokens,
    tokenLimit: TOKEN_LIMITS.GENERATE_SUMMARY.input,
    needsChunking: false,
    error: totalTokens > TOKEN_LIMITS.GENERATE_SUMMARY.input 
      ? `Summary would use ${totalTokens} tokens, but limit is ${TOKEN_LIMITS.GENERATE_SUMMARY.input}.`
      : undefined
  };
}

// Check if voice-to-contact request will fit in token limit
export function checkVoiceToContactTokens(
  transcription: string,
  currentContact: Contact
): TokenCheckResult {
  const basePrompt = 400;
  const transcriptionTokens = estimateTokenCount(transcription);
  const contactTokens = estimateTokenCount(JSON.stringify(currentContact));
  const totalTokens = basePrompt + transcriptionTokens + contactTokens;
  
  return {
    isValid: totalTokens <= TOKEN_LIMITS.VOICE_TO_CONTACT.input,
    estimatedTokens: totalTokens,
    tokenLimit: TOKEN_LIMITS.VOICE_TO_CONTACT.input,
    needsChunking: false,
    error: totalTokens > TOKEN_LIMITS.VOICE_TO_CONTACT.input 
      ? `Voice processing would use ${totalTokens} tokens, but limit is ${TOKEN_LIMITS.VOICE_TO_CONTACT.input}.`
      : undefined
  };
}

// Check if merge-contacts request will fit in token limit
export function checkMergeContactsTokens(
  existing: Contact,
  incoming: Contact
): TokenCheckResult {
  const basePrompt = 800;
  const existingTokens = estimateTokenCount(JSON.stringify(existing));
  const incomingTokens = estimateTokenCount(JSON.stringify(incoming));
  const totalTokens = basePrompt + existingTokens + incomingTokens;
  
  return {
    isValid: totalTokens <= TOKEN_LIMITS.MERGE_CONTACTS.input,
    estimatedTokens: totalTokens,
    tokenLimit: TOKEN_LIMITS.MERGE_CONTACTS.input,
    needsChunking: false,
    error: totalTokens > TOKEN_LIMITS.MERGE_CONTACTS.input 
      ? `Merge would use ${totalTokens} tokens, but limit is ${TOKEN_LIMITS.MERGE_CONTACTS.input}. Contact notes may be too long.`
      : undefined
  };
}