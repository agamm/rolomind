import { Ingestion } from "@polar-sh/ingestion";
import { LLMStrategy } from "@polar-sh/ingestion/strategies/LLM";
import { openrouter } from "@/lib/openrouter-config";
import { env } from "@/lib/env";

// Setup the LLM Ingestion Strategy for Claude 3.7 Sonnet
export const llmIngestion = Ingestion({ accessToken: env.POLAR_ACCESS_TOKEN, server: env.POLAR_SERVER })
  .strategy(new LLMStrategy(openrouter("anthropic/claude-3.7-sonnet")))
  .ingest("claude-3-7-sonnet");