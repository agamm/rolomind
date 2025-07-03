import Dexie, { type Table } from 'dexie';
import type { Contact } from '@/types/contact';

class ContactsDatabase extends Dexie {
  contacts!: Table<Contact>;

  constructor(userEmail: string) {
    // Escape email for database name (replace @ and . with _)
    const escapedEmail = userEmail.replace(/@/g, '_at_').replace(/\./g, '_dot_');
    super(`RolomindContacts_${escapedEmail}`);
    
    this.version(1).stores({
      // Index by id, name, company, role, location, source, and createdAt for efficient queries
      contacts: 'id, name, company, role, location, source, createdAt'
    });
  }
}

// Current user database instance
let currentUserDatabase: ContactsDatabase | null = null;

export function initializeUserDatabase(userEmail: string): void {
  if (!userEmail) return;
  currentUserDatabase = new ContactsDatabase(userEmail);
}

export function getCurrentUserDatabase(): ContactsDatabase {
  if (!currentUserDatabase) {
    throw new Error('User database not initialized. Please sign in first.');
  }
  return currentUserDatabase;
}

export function clearUserDatabase(): void {
  currentUserDatabase = null;
}

// Keep legacy export for backwards compatibility during migration
export const db = new ContactsDatabase('legacy');