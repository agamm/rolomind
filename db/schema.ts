import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company'),
  role: text('role'),
  location: text('location'),
  phones: text('phones').notNull().default('[]'), // JSON array
  emails: text('emails').notNull().default('[]'), // JSON array
  linkedinUrl: text('linkedin_url'),
  otherUrls: text('other_urls').notNull().default('[]'), // JSON array
  notes: text('notes').notNull().default(''),
  source: text('source').notNull(), // "google" | "linkedin" | "manual"
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type DbContact = typeof contacts.$inferSelect;
export type NewDbContact = typeof contacts.$inferInsert;