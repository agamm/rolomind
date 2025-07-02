// Centralized configuration file for all constants

// ================================
// PRICING CONFIGURATION
// ================================

// Base Claude pricing from provider (USD per million tokens)
export const BASE_PRICING = {
  CLAUDE_3_7_SONNET: {
    input: 3.00,   // $3 per million input tokens
    output: 15.00, // $15 per million output tokens
  },
  CLAUDE_3_HAIKU: {
    input: 0.25,   // $0.25 per million input tokens
    output: 1.25,  // $1.25 per million output tokens
  },
} as const;

// Profit margin we add on top
export const PROFIT_MARGIN = 0.20; // 20% profit

// Calculate final pricing with profit margin
export const PRICING_WITH_PROFIT = {
  CLAUDE_3_7_SONNET: {
    input: BASE_PRICING.CLAUDE_3_7_SONNET.input * (1 + PROFIT_MARGIN),   // $3.60
    output: BASE_PRICING.CLAUDE_3_7_SONNET.output * (1 + PROFIT_MARGIN), // $18.00
  },
  CLAUDE_3_HAIKU: {
    input: BASE_PRICING.CLAUDE_3_HAIKU.input * (1 + PROFIT_MARGIN),   // $0.30
    output: BASE_PRICING.CLAUDE_3_HAIKU.output * (1 + PROFIT_MARGIN), // $1.50
  },
} as const;

// ================================
// TOKEN LIMITS CONFIGURATION
// ================================

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
    output: 1000,
    model: 'claude-3.7-sonnet'
  },
  IMPORT_CONTACT: {
    input: 400,
    output: 100,
    model: 'claude-3-haiku'
  }
} as const;

// ================================
// CONTACT LIMITS CONFIGURATION
// ================================

// Contact storage limits
export const CONTACT_LIMITS = {
  MAX_CONTACTS: 10_000,
  MAX_TOKENS_PER_CONTACT: 500,
  WARNING_THRESHOLD: 0.9, // Warning at 90% capacity
  TOKEN_WARNING_THRESHOLD: 0.8, // Warning at 80% of token limit
} as const;

// ================================
// OPERATION COST ESTIMATES
// ================================

// Cost estimation helpers for different operations (in cents)
// Based on TOKEN_LIMITS and PRICING_WITH_PROFIT
export const OPERATION_ESTIMATES = {
  // Query contacts: max input (10K tokens) + output (1K tokens) using Claude 3.7 Sonnet
  SEARCH_1000_CONTACTS: Math.ceil((TOKEN_LIMITS.QUERY_CONTACTS.input / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_7_SONNET.input * 100) + 
                        Math.ceil((TOKEN_LIMITS.QUERY_CONTACTS.output / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_7_SONNET.output * 100),
  
  // Generate summary: max input (1.5K tokens) + output (200 tokens) using Claude 3.7 Sonnet  
  GENERATE_SUMMARY: Math.ceil((TOKEN_LIMITS.GENERATE_SUMMARY.input / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_7_SONNET.input * 100) + 
                   Math.ceil((TOKEN_LIMITS.GENERATE_SUMMARY.output / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_7_SONNET.output * 100),
  
  // Merge contacts: max input (1.5K tokens) + output (300 tokens) using Claude 3.7 Sonnet
  MERGE_CONTACTS: Math.ceil((TOKEN_LIMITS.MERGE_CONTACTS.input / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_7_SONNET.input * 100) + 
                 Math.ceil((TOKEN_LIMITS.MERGE_CONTACTS.output / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_7_SONNET.output * 100),
  
  // Voice processing: max input (1K tokens) + output (200 tokens) using Claude 3 Haiku
  VOICE_NOTE_30S: Math.ceil((TOKEN_LIMITS.VOICE_TO_CONTACT.input / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_HAIKU.input * 100) + 
                 Math.ceil((TOKEN_LIMITS.VOICE_TO_CONTACT.output / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_HAIKU.output * 100),
  
  // Import contact: max input (400 tokens) + output (100 tokens) using Claude 3 Haiku
  IMPORT_PER_CONTACT: Math.ceil((TOKEN_LIMITS.IMPORT_CONTACT.input / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_HAIKU.input * 100) + 
                     Math.ceil((TOKEN_LIMITS.IMPORT_CONTACT.output / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_HAIKU.output * 100),
  
  // Process results: max input (2K tokens) + output (1K tokens) using Claude 3.7 Sonnet
  PROCESS_RESULTS: Math.ceil((TOKEN_LIMITS.PROCESS_RESULTS.input / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_7_SONNET.input * 100) + 
                  Math.ceil((TOKEN_LIMITS.PROCESS_RESULTS.output / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_7_SONNET.output * 100),
} as const;

// ================================
// HELPER FUNCTIONS
// ================================

import { estimateTokenCount as tokenxEstimate } from 'tokenx';
import { Contact } from '@/types/contact';

// Token estimation
export function estimateTokenCount(text: string): number {
  // Use tokenx with 3 characters per token default
  return tokenxEstimate(text, {
    defaultCharsPerToken: 3
  });
}

// Token limit checking
export function checkTokenLimit(text: string, limit: number, operation: string): void {
  const tokenCount = estimateTokenCount(text);
  if (tokenCount > limit) {
    throw new Error(`Token limit exceeded for ${operation}: ${tokenCount} > ${limit}`);
  }
}

// Calculate cost in cents
export function calculateTokenCost(
  tokenCount: number,
  pricePerMillion: number
): number {
  // Convert to cents and round up
  return Math.ceil((tokenCount / 1_000_000) * pricePerMillion * 100);
}

// Format pricing display
export function formatPricing(pricePerMillion: number): string {
  return `$${pricePerMillion.toFixed(2)}/million`;
}

// Format pricing with base cost
export function formatPricingWithBase(
  basePrice: number,
  profitMargin: number = PROFIT_MARGIN
): string {
  const finalPrice = basePrice * (1 + profitMargin);
  return `$${finalPrice.toFixed(2)}/million ($${basePrice.toFixed(2)} + ${(profitMargin * 100).toFixed(0)}%)`;
}

// ================================
// CONTACT UTILITY FUNCTIONS
// ================================

// Estimate tokens for a single contact
export function getContactTokenCount(contact: Contact): number {
  const contactString = JSON.stringify(contact);
  return estimateTokenCount(contactString);
}

// Check if approaching contact limit
export function isApproachingContactLimit(currentCount: number): boolean {
  return currentCount >= (CONTACT_LIMITS.MAX_CONTACTS * CONTACT_LIMITS.WARNING_THRESHOLD);
}

// Get empty or minimal contacts (good candidates for deletion)
export function findEmptyContacts(contacts: Contact[]): Contact[] {
  return contacts.filter(contact => {
    const hasMinimalInfo = 
      !contact.company && 
      !contact.role && 
      !contact.location &&
      (!contact.notes || contact.notes.trim().length === 0) &&
      contact.contactInfo.phones.length === 0 &&
      contact.contactInfo.emails.length === 0 &&
      !contact.contactInfo.linkedinUrl;
    
    return hasMinimalInfo;
  });
}

// Calculate how much data a contact has (for sorting)
export function getContactDataScore(contact: Contact): number {
  let score = 0;
  
  // Basic fields (1 point each)
  if (contact.name) score += 1;
  if (contact.company) score += 1;
  if (contact.role) score += 1;
  if (contact.location) score += 1;
  if (contact.notes && contact.notes.trim().length > 0) score += 2; // Notes are worth more
  
  // Contact info (1 point each)
  score += contact.contactInfo.emails.length;
  score += contact.contactInfo.phones.length;
  if (contact.contactInfo.linkedinUrl) score += 1;
  score += (contact.contactInfo.otherUrls?.length || 0);
  
  return score;
}

// Find minimal contacts (name only, name + one field, or name + role only)
export function findMinimalContacts(contacts: Contact[]): Contact[] {
  return contacts.filter(contact => {
    const score = getContactDataScore(contact);
    // Score of 1 = name only
    // Score of 2 = name + one other field (email, phone, company, etc)
    if (score <= 2) return true;
    
    // Special case: name + role only (no other data)
    if (contact.name && contact.role && 
        !contact.company && 
        !contact.location && 
        (!contact.notes || contact.notes.trim().length === 0) &&
        contact.contactInfo.emails.length === 0 &&
        contact.contactInfo.phones.length === 0 &&
        !contact.contactInfo.linkedinUrl &&
        contact.contactInfo.otherUrls.length === 0) {
      return true;
    }
    
    return false;
  }).sort((a, b) => {
    // Sort by data score (least data first)
    return getContactDataScore(a) - getContactDataScore(b);
  });
}

// Find contacts without notes
export function findContactsWithoutNotes(contacts: Contact[]): Contact[] {
  return contacts.filter(contact => {
    return !contact.notes || contact.notes.trim().length === 0;
  });
}

// ================================
// TOKEN UTILITY FUNCTIONS
// ================================

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