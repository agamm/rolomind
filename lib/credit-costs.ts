export const CreditCost = {
  CLAUDE_3_7_SONNET: 5,
  CLAUDE_3_HAIKU: 1,
  OPENAI_WHISPER: 1,
  DEFAULT: 1,
} as const;

export type CreditCostType = typeof CreditCost[keyof typeof CreditCost];
