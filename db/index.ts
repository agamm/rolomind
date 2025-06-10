import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { eq, like, or, sql, count } from 'drizzle-orm';
import type { Contact } from '@/types/contact';
import { contacts } from './schema';
import { env } from '@/lib/env';

// For local development with SQLite, we don't need authToken
const isLocalSqlite = env.DATABASE_URL?.startsWith('file:');

const client = createClient({
  url: env.DATABASE_URL!,
  authToken: isLocalSqlite ? undefined : env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// Initialize database with schema
export async function initializeDatabase() {
  try {
    // The table will be created when migrations are run
    // For now, just test the connection
    await db.select({ count: count() }).from(contacts);
  } catch {
    console.log('Database initialization - schema may need to be created');
  }
}

// Helper functions to convert between Contact and DbContact
function contactToDb(contact: Contact): typeof contacts.$inferInsert {
  return {
    id: contact.id,
    name: contact.name,
    company: contact.company,
    role: contact.role,
    location: contact.location,
    phones: JSON.stringify(contact.contactInfo.phones),
    emails: JSON.stringify(contact.contactInfo.emails),
    linkedinUrl: contact.contactInfo.linkedinUrl,
    otherUrls: JSON.stringify(contact.contactInfo.otherUrls),
    notes: contact.notes,
    source: contact.source,
    createdAt: new Date(contact.createdAt),
    updatedAt: new Date(contact.updatedAt),
  };
}

function dbToContact(dbContact: typeof contacts.$inferSelect): Contact {
  return {
    id: dbContact.id,
    name: dbContact.name,
    company: dbContact.company || undefined,
    role: dbContact.role || undefined,
    location: dbContact.location || undefined,
    contactInfo: {
      phones: JSON.parse(dbContact.phones),
      emails: JSON.parse(dbContact.emails),
      linkedinUrl: dbContact.linkedinUrl || undefined,
      otherUrls: JSON.parse(dbContact.otherUrls),
    },
    notes: dbContact.notes,
    source: dbContact.source as "google" | "linkedin" | "manual",
    createdAt: dbContact.createdAt,
    updatedAt: dbContact.updatedAt,
  };
}

// Database operations
export async function getAllContacts(): Promise<Contact[]> {
  const dbContacts = db.query.contacts.findMany();
  return (await dbContacts).map(dbToContact);
}

export async function getContactById(id: string): Promise<Contact | null> {
  const dbContact = await db.query.contacts.findFirst({
    where: eq(contacts.id, id)
  });
  return dbContact ? dbToContact(dbContact) : null;
}

export async function createContactsBatch(contactList: Contact[]): Promise<void> {
  if (contactList.length === 0) return;
  
  // Convert all contacts to database format
  const dbContacts = contactList.map(contact => contactToDb(contact));
  
  // Insert all contacts in a single query
  await db.insert(contacts).values(dbContacts);
}

export async function updateContact(contact: Contact): Promise<void> {
  await db.update(contacts).set(contactToDb(contact)).where(eq(contacts.id, contact.id));
}

export async function deleteContact(id: string): Promise<void> {
  await db.delete(contacts).where(eq(contacts.id, id));
}

export async function deleteAllContacts(): Promise<void> {
  await db.delete(contacts);
}


export async function getContactsCount(): Promise<number> {
  const result = await db.select({ count: count() }).from(contacts);
  return result[0].count;
}

// Initialize database on import
initializeDatabase();

