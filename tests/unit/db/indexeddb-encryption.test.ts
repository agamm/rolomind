import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

// Unmock Dexie for this specific test file to use real IndexedDB
vi.unmock('dexie');
vi.unmock('dexie-encrypted');

// Import after setting up fake-indexeddb and unmocking
import { initializeUserDatabase, getCurrentUserDatabase, clearUserDatabase } from '@/db/indexdb/index';
import type { Contact } from '@/types/contact';

describe('IndexedDB Encryption Test', () => {
  const testUserEmail = 'test@example.com';
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    // Clear any existing database
    clearUserDatabase();
  });

  afterEach(async () => {
    // Clean up after each test
    clearUserDatabase();
  });

  it('should create a real IndexedDB database and store one contact', async () => {
    // Initialize the user database
    await initializeUserDatabase(testUserEmail, testUserId);
    
    // Get the database instance
    const db = await getCurrentUserDatabase();
    
    // Create a test contact using the correct Contact interface
    const testContact: Contact = {
      id: 'test-contact-1',
      name: 'John Doe',
      company: 'Test Company',
      role: 'Software Engineer',
      location: 'San Francisco, CA',
      contactInfo: {
        phones: ['+1-555-123-4567'],
        emails: ['john.doe@example.com'],
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        otherUrls: []
      },
      notes: 'Test contact for integration testing',
      source: 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store the contact in the database
    await db.contacts.add(testContact);

    // Verify the contact was stored
    const storedContact = await db.contacts.get('test-contact-1');
    expect(storedContact).toBeDefined();
    expect(storedContact?.name).toBe('John Doe');
    expect(storedContact?.company).toBe('Test Company');
    expect(storedContact?.role).toBe('Software Engineer');
    expect(storedContact?.location).toBe('San Francisco, CA');
    expect(storedContact?.contactInfo.emails).toEqual(['john.doe@example.com']);
    expect(storedContact?.contactInfo.phones).toEqual(['+1-555-123-4567']);
    expect(storedContact?.notes).toBe('Test contact for integration testing');
    expect(storedContact?.source).toBe('manual');

    // Verify the database contains exactly one contact
    const allContacts = await db.contacts.toArray();
    expect(allContacts).toHaveLength(1);
  });

  it('should encrypt sensitive data when reading directly from IndexedDB', async () => {
    // Initialize the user database
    await initializeUserDatabase(testUserEmail, testUserId);
    
    // Get the database instance
    const db = await getCurrentUserDatabase();
    
    // Create a test contact
    const testContact: Contact = {
      id: 'test-contact-encrypted',
      name: 'Jane Smith',
      company: 'Secret Corp',
      role: 'Security Engineer',
      location: 'New York, NY',
      contactInfo: {
        phones: ['+1-555-987-6543'],
        emails: ['jane.smith@secretcorp.com'],
        linkedinUrl: 'https://linkedin.com/in/janesmith',
        otherUrls: []
      },
      notes: 'Sensitive information that should be encrypted',
      source: 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store the contact using Dexie (which encrypts)
    await db.contacts.add(testContact);

    // Now read directly from IndexedDB without Dexie middleware
    const escapedEmail = testUserEmail.replace(/@/g, '_at_').replace(/\./g, '_dot_');
    const dbName = `RolomindContacts_${escapedEmail}_v5`;
    
    // Open raw IndexedDB connection
    const rawDbRequest = indexedDB.open(dbName);
    
    await new Promise<void>((resolve, reject) => {
      rawDbRequest.onsuccess = async () => {
        const rawDb = rawDbRequest.result;
        
        try {
          // Read raw data from IndexedDB
          const transaction = rawDb.transaction(['contacts'], 'readonly');
          const store = transaction.objectStore('contacts');
          const getRequest = store.get('test-contact-encrypted');
          
          getRequest.onsuccess = () => {
            const rawContact = getRequest.result;
            
            // Verify the contact exists
            expect(rawContact).toBeDefined();
            
            // Convert the entire raw contact to JSON string to search for original values
            const rawContactJson = JSON.stringify(rawContact);
            
            console.log('Raw contact data:', rawContactJson);
            
            // Check if original sensitive values are NOT present in the raw data
            expect(rawContactJson).not.toContain('Jane Smith');
            expect(rawContactJson).not.toContain('Secret Corp');
            expect(rawContactJson).not.toContain('Security Engineer');
            expect(rawContactJson).not.toContain('Sensitive information that should be encrypted');
            expect(rawContactJson).not.toContain('jane.smith@secretcorp.com');
            expect(rawContactJson).not.toContain('+1-555-987-6543');
            
            // Verify that unencrypted fields are still readable
            expect(rawContactJson).toContain('manual');
            expect(rawContactJson).toContain('test-contact-encrypted');
            
            rawDb.close();
            resolve();
          };
          
          getRequest.onerror = () => {
            rawDb.close();
            reject(new Error('Failed to read raw contact data'));
          };
        } catch (error) {
          rawDb.close();
          reject(error);
        }
      };
      
      rawDbRequest.onerror = () => {
        reject(new Error('Failed to open raw IndexedDB connection'));
      };
    });
  });

  it('should isolate data between different users', async () => {
    // User 1 setup
    const user1Email = 'user1@example.com';
    const user1Id = 'user1-123';
    const user1Contact: Contact = {
      id: 'user1-contact',
      name: 'User One Contact',
      company: 'Company One',
      role: 'Role One',
      contactInfo: {
        phones: ['111-111-1111'],
        emails: ['user1@company.com'],
        otherUrls: []
      },
      notes: 'User 1 secret notes',
      source: 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // User 2 setup  
    const user2Email = 'user2@example.com';
    const user2Id = 'user2-456';
    const user2Contact: Contact = {
      id: 'user2-contact',
      name: 'User Two Contact',
      company: 'Company Two',
      role: 'Role Two',
      contactInfo: {
        phones: ['222-222-2222'],
        emails: ['user2@company.com'],
        otherUrls: []
      },
      notes: 'User 2 secret notes',
      source: 'manual',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Initialize and store data for User 1
    await initializeUserDatabase(user1Email, user1Id);
    const user1Db = await getCurrentUserDatabase();
    await user1Db.contacts.add(user1Contact);

    // Initialize and store data for User 2
    await initializeUserDatabase(user2Email, user2Id);
    const user2Db = await getCurrentUserDatabase();
    await user2Db.contacts.add(user2Contact);

    // Verify User 2 can only see their own data
    const user2Contacts = await user2Db.contacts.toArray();
    expect(user2Contacts).toHaveLength(1);
    expect(user2Contacts[0].name).toBe('User Two Contact');
    expect(user2Contacts[0].company).toBe('Company Two');

    // Switch back to User 1 and verify they can only see their own data
    await initializeUserDatabase(user1Email, user1Id);
    const user1DbAgain = await getCurrentUserDatabase();
    const user1Contacts = await user1DbAgain.contacts.toArray();
    expect(user1Contacts).toHaveLength(1);
    expect(user1Contacts[0].name).toBe('User One Contact');
    expect(user1Contacts[0].company).toBe('Company One');

    // Verify different database names are created
    const user1DbName = `RolomindContacts_${user1Email.replace(/@/g, '_at_').replace(/\./g, '_dot_')}_v5`;
    const user2DbName = `RolomindContacts_${user2Email.replace(/@/g, '_at_').replace(/\./g, '_dot_')}_v5`;
    expect(user1DbName).not.toBe(user2DbName);

    // Verify raw data isolation - User 1's data should not contain User 2's info
    const user1RawDbRequest = indexedDB.open(user1DbName);
    await new Promise<void>((resolve, reject) => {
      user1RawDbRequest.onsuccess = () => {
        const rawDb = user1RawDbRequest.result;
        const transaction = rawDb.transaction(['contacts'], 'readonly');
        const store = transaction.objectStore('contacts');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const allRawContacts = getAllRequest.result;
          const allRawJson = JSON.stringify(allRawContacts);
          
          // User 1's database should not contain User 2's data
          expect(allRawJson).not.toContain('User Two Contact');
          expect(allRawJson).not.toContain('Company Two');
          expect(allRawJson).not.toContain('user2@company.com');
          expect(allRawJson).not.toContain('User 2 secret notes');
          
          // But should contain User 1's unencrypted fields
          expect(allRawJson).toContain('user1-contact');
          expect(allRawJson).toContain('manual');
          
          rawDb.close();
          resolve();
        };
        
        getAllRequest.onerror = () => {
          rawDb.close();
          reject(new Error('Failed to read all contacts'));
        };
      };
      
      user1RawDbRequest.onerror = () => {
        reject(new Error('Failed to open User 1 database'));
      };
    });
  });
});