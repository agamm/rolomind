import { getCurrentUserDatabase } from './index';
import type { Contact } from '@/types/contact';
import { v4 as uuidv4 } from 'uuid';

// Helper to get current user database
function getDatabase() {
  return getCurrentUserDatabase();
}

// Get all contacts
export async function getAllContacts(): Promise<Contact[]> {
  return await getDatabase().contacts.toArray();
}

// Get contact by ID
export async function getContactById(id: string): Promise<Contact | undefined> {
  return await getDatabase().contacts.get(id);
}

// Create multiple contacts using bulk operation
export async function createContactsBatch(contacts: Contact[]): Promise<void> {
  const contactsWithIds = contacts.map(contact => ({
    ...contact,
    id: contact.id || uuidv4(),
    createdAt: contact.createdAt || new Date(),
    updatedAt: contact.updatedAt || new Date()
  }));
  
  await getDatabase().contacts.bulkAdd(contactsWithIds);
}

// Create single contact
export async function createContact(contact: Contact): Promise<string> {
  const id = contact.id || uuidv4();
  const newContact = {
    ...contact,
    id,
    createdAt: contact.createdAt || new Date(),
    updatedAt: contact.updatedAt || new Date()
  };
  
  await getDatabase().contacts.add(newContact);
  return id;
}

// Update contact
export async function updateContact(contact: Contact): Promise<void> {
  await getDatabase().contacts.put({
    ...contact,
    updatedAt: new Date()
  });
}

// Update multiple contacts using bulk operation
export async function updateContactsBatch(contacts: Contact[]): Promise<void> {
  const updatedContacts = contacts.map(contact => ({
    ...contact,
    updatedAt: new Date()
  }));
  
  await getDatabase().contacts.bulkPut(updatedContacts);
}

// Delete contact by ID
export async function deleteContact(id: string): Promise<void> {
  await getDatabase().contacts.delete(id);
}

// Delete multiple contacts using bulk operation
export async function deleteContactsBatch(ids: string[]): Promise<void> {
  await getDatabase().contacts.bulkDelete(ids);
}

// Delete all contacts
export async function deleteAllContacts(): Promise<void> {
  await getDatabase().contacts.clear();
}

// Get contacts count
export async function getContactsCount(): Promise<number> {
  return await getDatabase().contacts.count();
}

// Search contacts by query
export async function searchContacts(query: string): Promise<Contact[]> {
  const lowercaseQuery = query.toLowerCase();
  
  return await getDatabase().contacts
    .filter(contact => {
      return contact.name.toLowerCase().includes(lowercaseQuery) ||
        (contact.company?.toLowerCase().includes(lowercaseQuery) ?? false) ||
        (contact.role?.toLowerCase().includes(lowercaseQuery) ?? false) ||
        (contact.location?.toLowerCase().includes(lowercaseQuery) ?? false);
    })
    .toArray();
}

// Get contacts by source
export async function getContactsBySource(source: 'google' | 'linkedin' | 'manual'): Promise<Contact[]> {
  return await getDatabase().contacts
    .where('source')
    .equals(source)
    .toArray();
}