// Re-export local database operations
export * from './local/contacts';
export { db as localDb } from './local/index';

// Re-export cloud database for future use
export { db as cloudDb } from './cloud/index';