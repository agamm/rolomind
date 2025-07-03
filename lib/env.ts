import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DATABASE_AUTH_TOKEN: z.string().optional(),
    BETTER_AUTH_URL: z.string().url().optional().default("http://localhost:3000"),
    BETTER_AUTH_SECRET: z.string().min(32),
    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_SERVER: z.enum(['sandbox', 'production']).default('sandbox'),
    POLAR_PRODUCT_ID: z.string().min(1),
  },
  client: {
    // Add client-side env vars here if needed
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_SERVER: process.env.POLAR_SERVER,
    POLAR_PRODUCT_ID: process.env.POLAR_PRODUCT_ID,
  },
  emptyStringAsUndefined: true,
});