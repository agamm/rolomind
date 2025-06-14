import { db } from './index';
import type { Contact } from '@/types/contact';
import { v4 as uuidv4 } from 'uuid';

// Get all contacts
export async function getAllContacts(): Promise<Contact[]> {
  return await db.contacts.toArray();
}

// Get contact by ID
export async function getContactById(id: string): Promise<Contact | undefined> {
  return await db.contacts.get(id);
}

// Create multiple contacts using bulk operation
export async function createContactsBatch(contacts: Contact[]): Promise<void> {
  const contactsWithIds = contacts.map(contact => ({
    ...contact,
    id: contact.id || uuidv4(),
    createdAt: contact.createdAt || new Date(),
    updatedAt: contact.updatedAt || new Date()
  }));
  
  await db.contacts.bulkAdd(contactsWithIds);
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
  
  await db.contacts.add(newContact);
  return id;
}

// Update contact
export async function updateContact(contact: Contact): Promise<void> {
  await db.contacts.put({
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
  
  await db.contacts.bulkPut(updatedContacts);
}

// Delete contact by ID
export async function deleteContact(id: string): Promise<void> {
  await db.contacts.delete(id);
}

// Delete multiple contacts using bulk operation
export async function deleteContactsBatch(ids: string[]): Promise<void> {
  await db.contacts.bulkDelete(ids);
}

// Delete all contacts
export async function deleteAllContacts(): Promise<void> {
  await db.contacts.clear();
}

// Get contacts count
export async function getContactsCount(): Promise<number> {
  return await db.contacts.count();
}

// Search contacts by query
export async function searchContacts(query: string): Promise<Contact[]> {
  const lowercaseQuery = query.toLowerCase();
  
  return await db.contacts
    .filter(contact => 
      contact.name.toLowerCase().includes(lowercaseQuery) ||
      (contact.company && contact.company.toLowerCase().includes(lowercaseQuery)) ||
      (contact.role && contact.role.toLowerCase().includes(lowercaseQuery)) ||
      (contact.location && contact.location.toLowerCase().includes(lowercaseQuery))
    )
    .toArray();
}

// Get contacts by source
export async function getContactsBySource(source: 'google' | 'linkedin' | 'manual'): Promise<Contact[]> {
  return await db.contacts
    .where('source')
    .equals(source)
    .toArray();
}