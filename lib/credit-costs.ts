export const CreditCost = {
  // Search operations (total 5 credits for full search)
  QUERY_CONTACTS: 2,        // Claude 3.7 Sonnet for query
  PROCESS_RESULTS: 2,       // Claude 3.7 Sonnet for sorting/filtering
  GENERATE_SUMMARY: 1,      // Claude 3.7 Sonnet for summary
  
  // Other operations
  MERGE_CONTACTS: 1,        // Claude 3.7 Sonnet
  VOICE_TRANSCRIBE: 0.5,    // OpenAI Whisper
  VOICE_PROCESS: 0.5,       // Claude 3 Haiku
  IMPORT_NORMALIZE: 0.01,   // Claude 3 Haiku (100 contacts = 1 credit)
} as const;

export type CreditCostType = typeof CreditCost[keyof typeof CreditCost];
