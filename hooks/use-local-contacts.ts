import { useLiveQuery } from 'dexie-react-hooks';
import { getCurrentUserDatabase, initializeUserDatabase } from '@/db/indexdb';
import type { Contact } from '@/types/contact';
import Papa from 'papaparse';
import { useEffect, useState } from 'react';
import { 
  CONTACT_LIMITS,
  getContactTokenCount 
} from '@/lib/config';
import { useSession } from '@/lib/auth/auth-client';

type DatabaseState = 'initializing' | 'unencrypting' | 'ready';

// Hook to get all contacts with real-time updates
export function useContacts(searchQuery?: string) {
  const { data: session } = useSession();
  const [dbInstance, setDbInstance] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [databaseState, setDatabaseState] = useState<DatabaseState>('initializing');
  
  // Initialize user database when session changes
  useEffect(() => {
    if (session?.user?.email && session?.user?.id) {
      setDatabaseState('unencrypting');
      initializeUserDatabase(session.user.email, session.user.id)
        .then(() => getCurrentUserDatabase())
        .then(db => {
          console.log('Database initialized:', db);
          setDbInstance(db);
          setDatabaseState('ready');
        })
        .catch(error => {
          console.error('Failed to initialize user database:', error);
          setDatabaseState('initializing'); // Reset to initializing on error
        });
    } else {
      setDatabaseState('initializing');
      setDbInstance(null);
    }
  }, [session?.user?.email, session?.user?.id]);

  // Force refresh function that can be called from outside
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshContacts = () => {
        console.log('Refreshing contacts...');
        setRefreshTrigger(prev => prev + 1);
      };
    }
  }, []);
  
  const contacts = useLiveQuery(
    async () => {
      if (!session?.user?.email || !dbInstance || databaseState !== 'ready') {
        return undefined; // Return undefined during initialization
      }
      
      try {
        console.log('Querying contacts from database...');
        
        if (searchQuery && searchQuery.trim()) {
          const lowercaseQuery = searchQuery.toLowerCase();
          const results = await dbInstance.contacts
            .filter((contact: any) => {
              return contact.name.toLowerCase().includes(lowercaseQuery) ||
                (contact.company?.toLowerCase().includes(lowercaseQuery) ?? false) ||
                (contact.role?.toLowerCase().includes(lowercaseQuery) ?? false) ||
                (contact.location?.toLowerCase().includes(lowercaseQuery) ?? false);
            })
            .toArray();
          console.log('Search results:', results.length);
          return results;
        }
        const allContacts = await dbInstance.contacts.toArray();
        console.log('All contacts:', allContacts.length);
        return allContacts;
      } catch (err) {
        console.error('Failed to load contacts:', err);
        return [];
      }
    },
    [searchQuery, session?.user?.email, dbInstance, refreshTrigger, databaseState]
  );

  // Add a flag to indicate if this is the initial load
  const isInitialLoad = databaseState !== 'ready' || contacts === undefined;
  
  return {
    data: contacts || [],
    isLoading: isInitialLoad,
    state: databaseState,
    isInitialLoad,
  };
}

// Hook to get a single contact
export function useContact(id: string) {
  const { data: session } = useSession();
  
  // Initialize user database when session changes
  useEffect(() => {
    if (session?.user?.email && session?.user?.id) {
      initializeUserDatabase(session.user.email, session.user.id).catch(error => {
        console.error('Failed to initialize user database:', error);
      });
    }
  }, [session?.user?.email, session?.user?.id]);
  
  const contact = useLiveQuery(
    async () => {
      if (!session?.user?.email) return undefined;
      try {
        const db = await getCurrentUserDatabase();
        return await db.contacts.get(id);
      } catch (err) {
        console.error('Failed to load contact:', err);
        return undefined;
      }
    },
    [id, session?.user?.email]
  );

  return {
    data: contact,
    isLoading: contact === undefined,
  };
}

// Simple database operation functions (no mutations)
export async function saveContacts(contacts: Contact[]): Promise<void> {
  // Check contact limit
  const db = await getCurrentUserDatabase();
  const currentCount = await db.contacts.count();
  
  if ((currentCount + contacts.length) > CONTACT_LIMITS.MAX_CONTACTS) {
    throw new Error(
      `Cannot add ${contacts.length} contacts. Would exceed limit of ${CONTACT_LIMITS.MAX_CONTACTS} contacts. ` +
      `Current: ${currentCount}, Limit: ${CONTACT_LIMITS.MAX_CONTACTS}`
    );
  }
  
  // Validate each contact
  const validationErrors: string[] = [];
  contacts.forEach((contact, index) => {
    if (!contact.name || contact.name.trim().length === 0) {
      validationErrors.push(`Contact ${index + 1}: Must have a name`);
    }
    const tokenCount = getContactTokenCount(contact);
    if (tokenCount > CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT) {
      validationErrors.push(`Contact ${index + 1} (${contact.name}): Exceeds token limit (${tokenCount}/${CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT} tokens)`);
    }
  });
  
  if (validationErrors.length > 0) {
    throw new Error(`Contact validation failed:\n${validationErrors.join('\n')}`);
  }
  
  // Add contacts with IDs and timestamps
  const contactsWithIds = contacts.map(contact => ({
    ...contact,
    id: contact.id || crypto.randomUUID(),
    createdAt: contact.createdAt || new Date(),
    updatedAt: contact.updatedAt || new Date()
  }));
  
  await db.contacts.bulkAdd(contactsWithIds);
}

export async function saveContact(contact: Contact): Promise<string> {
  // Check contact limit
  const db = await getCurrentUserDatabase();
  const currentCount = await db.contacts.count();
  
  if ((currentCount + 1) > CONTACT_LIMITS.MAX_CONTACTS) {
    throw new Error(
      `Cannot add contact. Limit of ${CONTACT_LIMITS.MAX_CONTACTS} contacts reached. ` +
      `Please delete some contacts first.`
    );
  }
  
  // Validate contact
  if (!contact.name || contact.name.trim().length === 0) {
    throw new Error('Contact must have a name');
  }
  const tokenCount = getContactTokenCount(contact);
  if (tokenCount > CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT) {
    throw new Error(`Contact exceeds token limit (${tokenCount}/${CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT} tokens)`);
  }
  
  const id = contact.id || crypto.randomUUID();
  const newContact = {
    ...contact,
    id,
    createdAt: contact.createdAt || new Date(),
    updatedAt: contact.updatedAt || new Date()
  };
  
  await db.contacts.add(newContact);
  return id;
}

export async function updateContact(contact: Contact): Promise<void> {
  // Validate contact
  if (!contact.name || contact.name.trim().length === 0) {
    throw new Error('Contact must have a name');
  }
  const tokenCount = getContactTokenCount(contact);
  if (tokenCount > CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT) {
    throw new Error(`Contact exceeds token limit (${tokenCount}/${CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT} tokens)`);
  }
  
  const db = await getCurrentUserDatabase();
  await db.contacts.put({
    ...contact,
    updatedAt: new Date()
  });
}

export async function deleteContact(id: string): Promise<void> {
  const db = await getCurrentUserDatabase();
  console.log('Deleting contact with ID:', id);
  await db.contacts.delete(id);
  console.log('Contact deleted successfully');
}

export async function deleteContacts(ids: string[]): Promise<void> {
  const db = await getCurrentUserDatabase();
  console.log('Bulk deleting contacts with IDs:', ids);
  await db.contacts.bulkDelete(ids);
  console.log('Contacts deleted successfully');
}

export async function deleteAllContacts(): Promise<void> {
  const db = await getCurrentUserDatabase();
  await db.contacts.clear();
}

export async function getContactsCount(): Promise<number> {
  const db = await getCurrentUserDatabase();
  return await db.contacts.count();
}

// Hook for exporting contacts to CSV
export function useExportContacts() {
  const { data: session } = useSession();
  
  // Initialize user database when session changes
  useEffect(() => {
    if (session?.user?.email && session?.user?.id) {
      initializeUserDatabase(session.user.email, session.user.id).catch(error => {
        console.error('Failed to initialize user database:', error);
      });
    }
  }, [session?.user?.email, session?.user?.id]);
  
  return {
    exportToCSV: async (contacts?: Contact[]) => {
      if (!session?.user?.email) {
        throw new Error('User not authenticated');
      }
      
      // If no contacts provided, get all from database
      let contactsToExport = contacts;
      if (!contactsToExport) {
        const db = await getCurrentUserDatabase();
        contactsToExport = await db.contacts.toArray();
      }
      
      // Transform contacts to CSV format
      const csvData = contactsToExport.map(contact => ({
        Name: contact.name,
        Company: contact.company || '',
        Role: contact.role || '',
        Location: contact.location || '',
        Phones: contact.contactInfo.phones.join(', '),
        Emails: contact.contactInfo.emails.join(', '),
        'LinkedIn URL': contact.contactInfo.linkedinUrl || '',
        'Other URLs': contact.contactInfo.otherUrls.map(u => `${u.platform}: ${u.url}`).join(', '),
        Notes: contact.notes,
        Source: contact.source,
        'Created At': new Date(contact.createdAt).toLocaleDateString(),
        'Updated At': new Date(contact.updatedAt).toLocaleDateString()
      }));

      // Generate CSV
      const csv = Papa.unparse(csvData);
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }
  };
}