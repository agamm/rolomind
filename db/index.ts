// Re-export IndexDB database operations for contacts
export * from './indexdb/contacts';
export { db as indexDb } from './indexdb/index';

// Re-export SQLite database for authentication
export { db as sqliteDb } from './sqlite/index';