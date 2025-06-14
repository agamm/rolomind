import Dexie, { type Table } from 'dexie';
import type { Contact } from '@/types/contact';

export interface DexieContact extends Contact {
  // Contact already has all fields we need
}

class ContactsDatabase extends Dexie {
  contacts!: Table<DexieContact>;

  constructor() {
    super('RolomindContacts');
    
    this.version(1).stores({
      // Index by id, name, company, role, location, source, and createdAt for efficient queries
      contacts: 'id, name, company, role, location, source, createdAt'
    });
  }
}

export const db = new ContactsDatabase();