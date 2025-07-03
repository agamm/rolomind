import Dexie, { type Table } from 'dexie';
import { applyEncryptionMiddleware } from 'dexie-encrypted';
import type { Contact } from '@/types/contact';

// Import the utf8 module for patching
let utf8Module: { encode?: (str: string) => Uint8Array } | null;
try {
  utf8Module = require('@stablelib/utf8');
} catch {
  utf8Module = null;
}

// Patch the utf8 encoder used by dexie-encrypted to handle UTF-8 properly
function patchUtf8Encoding() {
  try {
    if (utf8Module && utf8Module.encode) {
      const originalEncode = utf8Module.encode;
      utf8Module.encode = function(str: string): Uint8Array {
        try {
          // Normalize the string first to handle different Unicode representations
          const normalized = str.normalize('NFC');
          
          // Use TextEncoder for proper UTF-8 encoding including emojis
          const encoder = new TextEncoder();
          return encoder.encode(normalized);
        } catch {
          console.warn('UTF-8 encoding fallback for string:', str);
          // Fallback to original function
          return originalEncode(str);
        }
      };
    }
  } catch {
    console.log('Could not patch utf8 encoding, using fallback approach');
  }
}

class ContactsDatabase extends Dexie {
  contacts!: Table<Contact>;
  private encryptionKey: Promise<Uint8Array>;

  constructor(userEmail: string, userId: string) {
    // Escape email for database name (replace @ and . with _)
    const escapedEmail = userEmail.replace(/@/g, '_at_').replace(/\./g, '_dot_');
    super(`RolomindContacts_${escapedEmail}_v5`); // v5 with patched UTF-8 encoding
    
    // Patch UTF-8 encoding before applying encryption
    patchUtf8Encoding();
    
    // Store encryption key promise
    this.encryptionKey = deriveEncryptionKey(userId);
    
    // Apply encryption middleware with patched UTF-8 handling
    applyEncryptionMiddleware(
      this, 
      this.encryptionKey, 
      {
        contacts: {
          // Keep indexable fields unencrypted, encrypt everything else
          type: 'unencrypt',
          fields: ['id', 'source', 'createdAt', 'updatedAt']
        }
      } as any,
      async () => {
        // onKeyChange callback
        console.warn('Encryption key changed - this should not happen');
      }
    );
    
    // Define version after applying encryption
    this.version(1).stores({
      // Only keep essential indexable fields unencrypted
      contacts: 'id, source, createdAt'
    });
  }
}

// Production-ready encryption key derivation using Web Crypto API
async function deriveEncryptionKey(userId: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const salt = encoder.encode('rolomind-salt-v1'); // Application-specific salt
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const keyBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 bytes
  );
  
  return new Uint8Array(keyBuffer);
}

// TODO: Re-add encryption key derivation when encryption is re-enabled

// Current user database instance
let currentUserDatabase: ContactsDatabase | null = null;
let currentUserInfo: { email: string; id: string } | null = null;
let initializationPromise: Promise<void> | null = null;

export async function initializeUserDatabase(userEmail: string, userId: string): Promise<void> {
  if (!userEmail || !userId) return;
  
  // Close existing database if user changed
  if (currentUserInfo && (currentUserInfo.email !== userEmail || currentUserInfo.id !== userId)) {
    if (currentUserDatabase) {
      currentUserDatabase.close();
    }
  }
  
  currentUserInfo = { email: userEmail, id: userId };
  
  // Create initialization promise to ensure database is ready
  initializationPromise = (async () => {
    currentUserDatabase = new ContactsDatabase(userEmail, userId);
    // Wait for database to be ready
    await currentUserDatabase.open();
  })();
  
  await initializationPromise;
}

export async function getCurrentUserDatabase(): Promise<ContactsDatabase> {
  // Wait for initialization if in progress
  if (initializationPromise) {
    await initializationPromise;
  }
  
  if (!currentUserDatabase) {
    throw new Error('User database not initialized. Please sign in first.');
  }
  
  return currentUserDatabase;
}

export function clearUserDatabase(): void {
  if (currentUserDatabase) {
    currentUserDatabase.close();
  }
  currentUserDatabase = null;
  currentUserInfo = null;
  initializationPromise = null;
}

