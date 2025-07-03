// Re-export IndexDB database operations for contacts
export * from './indexdb/contacts';
export { getCurrentUserDatabase, initializeUserDatabase, clearUserDatabase } from './indexdb/index';

// Re-export SQLite database for authentication
export { db as sqliteDb } from './sqlite/index';