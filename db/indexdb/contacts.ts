import { getCurrentUserDatabase } from './index';
import type { Contact } from '@/types/contact';
import { v4 as uuidv4 } from 'uuid';

// Helper to get current user database
async function getDatabase() {
  return await getCurrentUserDatabase();
}

// Get all contacts
export async function getAllContacts(): Promise<Contact[]> {
  const db = await getDatabase();
  return await db.contacts.toArray();
}

// Get contact by ID
export async function getContactById(id: string): Promise<Contact | undefined> {
  const db = await getDatabase();
  return await db.contacts.get(id);
}

// Helper function to ensure proper UTF-8 encoding
function ensureValidUtf8(str: string | undefined | null): string {
  if (!str) return '';
  
  try {
    // First, normalize the string to handle different Unicode representations
    const normalized = str.normalize('NFC');
    
    // Convert to UTF-8 and back to ensure it's valid
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const encoded = encoder.encode(normalized);
    const decoded = decoder.decode(encoded);
    
    // Remove only actual control characters (keeping emojis and other valid UTF-8)
    return decoded
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  } catch (error) {
    console.warn('UTF-8 encoding issue with string:', str, error);
    // If encoding fails, return empty string to prevent errors
    return '';
  }
}

// Deep sanitize contact object while preserving UTF-8 characters
function sanitizeContact(contact: Contact): Contact {
  return {
    ...contact,
    name: ensureValidUtf8(contact.name),
    company: ensureValidUtf8(contact.company),
    role: ensureValidUtf8(contact.role),
    location: ensureValidUtf8(contact.location),
    notes: ensureValidUtf8(contact.notes),
    contactInfo: {
      ...contact.contactInfo,
      phones: contact.contactInfo.phones.map(ensureValidUtf8).filter(Boolean),
      emails: contact.contactInfo.emails.map(ensureValidUtf8).filter(Boolean),
      linkedinUrl: ensureValidUtf8(contact.contactInfo.linkedinUrl),
      otherUrls: contact.contactInfo.otherUrls.map(url => ({
        platform: ensureValidUtf8(url.platform),
        url: ensureValidUtf8(url.url)
      })).filter(url => url.platform && url.url)
    }
  };
}

// Create multiple contacts using bulk operation
export async function createContactsBatch(contacts: Contact[]): Promise<void> {
  const contactsWithIds = contacts.map(contact => {
    const sanitized = sanitizeContact(contact);
    return {
      ...sanitized,
      id: sanitized.id || uuidv4(),
      createdAt: sanitized.createdAt || new Date(),
      updatedAt: sanitized.updatedAt || new Date()
    };
  });
  
  const db = await getDatabase();
  await db.contacts.bulkAdd(contactsWithIds);
}

// Create single contact
export async function createContact(contact: Contact): Promise<string> {
  const sanitized = sanitizeContact(contact);
  const id = sanitized.id || uuidv4();
  const newContact = {
    ...sanitized,
    id,
    createdAt: sanitized.createdAt || new Date(),
    updatedAt: sanitized.updatedAt || new Date()
  };
  
  const db = await getDatabase();
  await db.contacts.add(newContact);
  return id;
}

// Update contact
export async function updateContact(contact: Contact): Promise<void> {
  const sanitized = sanitizeContact(contact);
  const db = await getDatabase();
  await db.contacts.put({
    ...sanitized,
    updatedAt: new Date()
  });
}

// Update multiple contacts using bulk operation
export async function updateContactsBatch(contacts: Contact[]): Promise<void> {
  const updatedContacts = contacts.map(contact => {
    const sanitized = sanitizeContact(contact);
    return {
      ...sanitized,
      updatedAt: new Date()
    };
  });
  
  const db = await getDatabase();
  await db.contacts.bulkPut(updatedContacts);
}

// Delete contact by ID
export async function deleteContact(id: string): Promise<void> {
  const db = await getDatabase();
  await db.contacts.delete(id);
}

// Delete multiple contacts using bulk operation
export async function deleteContactsBatch(ids: string[]): Promise<void> {
  const db = await getDatabase();
  await db.contacts.bulkDelete(ids);
}

// Delete all contacts
export async function deleteAllContacts(): Promise<void> {
  const db = await getDatabase();
  await db.contacts.clear();
}

// Get contacts count
export async function getContactsCount(): Promise<number> {
  const db = await getDatabase();
  return await db.contacts.count();
}

// Search contacts by query
export async function searchContacts(query: string): Promise<Contact[]> {
  const lowercaseQuery = query.toLowerCase();
  const db = await getDatabase();
  
  return await db.contacts
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
  const db = await getDatabase();
  return await db.contacts
    .where('source')
    .equals(source)
    .toArray();
}