import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// In development mode, use local SQLite file if DATABASE_URL is not provided
const isLocalDev = process.env.NODE_ENV === 'development';
const defaultDatabaseUrl = isLocalDev ? 'file:./data/contacts.db' : undefined;

export const env = createEnv({
  server: {
    OPENROUTER_API_KEY: z.string().min(1),
    DATABASE_URL: z.string().min(1).default(defaultDatabaseUrl || ''),
    DATABASE_AUTH_TOKEN: z.string().optional(),
    BETTER_AUTH_URL: z.string().url().optional().default("http://localhost:3000"),
    BETTER_AUTH_SECRET: z.string().min(32),
  },
  client: {
    // Add client-side env vars here if needed
  },
  runtimeEnv: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL || defaultDatabaseUrl,
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  },
  emptyStringAsUndefined: true,
});