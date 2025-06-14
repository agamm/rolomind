import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { env } from '@/lib/env';

// For local development with SQLite, we don't need authToken
const isLocalSqlite = env.DATABASE_URL?.startsWith('file:');

const client = createClient({
  url: env.DATABASE_URL!,
  authToken: isLocalSqlite ? undefined : env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// This will be used for future authentication features