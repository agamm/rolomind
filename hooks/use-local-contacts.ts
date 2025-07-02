import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/indexdb';
import { 
  createContact, 
  createContactsBatch, 
  updateContact, 
  deleteContact, 
  deleteAllContacts,
  searchContacts 
} from '@/db/indexdb/contacts';
import type { Contact } from '@/types/contact';
import Papa from 'papaparse';
import { useState, useEffect } from 'react';
import { 
  CONTACT_LIMITS,
  getContactTokenCount 
} from '@/lib/config';

// Hook to get all contacts with real-time updates
export function useContacts(searchQuery?: string) {
  const [error, setError] = useState<Error | null>(null);
  
  const contacts = useLiveQuery(
    async () => {
      try {
        setError(null);
        if (searchQuery && searchQuery.trim()) {
          return await searchContacts(searchQuery);
        }
        return await db.contacts.toArray();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load contacts'));
        return [];
      }
    },
    [searchQuery]
  );

  return {
    data: contacts || [],
    isLoading: contacts === undefined,
    error
  };
}

// Hook to get a single contact
export function useContact(id: string) {
  const contact = useLiveQuery(
    async () => await db.contacts.get(id),
    [id]
  );

  return {
    data: contact,
    isLoading: contact === undefined,
    error: null
  };
}

// Hook for saving contacts
export function useSaveContacts() {
  return {
    mutateAsync: async (contacts: Contact[]) => {
      // Check contact limit
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
      
      await createContactsBatch(contacts);
    },
    mutate: (contacts: Contact[]) => {
      createContactsBatch(contacts).catch(console.error);
    }
  };
}

// Hook for creating a single contact
export function useCreateContact() {
  return {
    mutateAsync: async (contact: Contact) => {
      // Check contact limit
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
      
      return await createContact(contact);
    },
    mutate: (contact: Contact) => {
      createContact(contact).catch(console.error);
    }
  };
}

// Hook for updating a contact
export function useUpdateContact() {
  return {
    mutateAsync: async (contact: Contact) => {
      // Validate contact
      if (!contact.name || contact.name.trim().length === 0) {
        throw new Error('Contact must have a name');
      }
      const tokenCount = getContactTokenCount(contact);
      if (tokenCount > CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT) {
        throw new Error(`Contact exceeds token limit (${tokenCount}/${CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT} tokens)`);
      }
      
      await updateContact(contact);
    },
    mutate: (contact: Contact) => {
      updateContact(contact).catch(console.error);
    }
  };
}

// Hook for deleting a contact
export function useDeleteContact() {
  return {
    mutateAsync: async (id: string) => {
      await deleteContact(id);
    },
    mutate: (id: string) => {
      deleteContact(id).catch(console.error);
    }
  };
}

// Hook for deleting all contacts
export function useDeleteAllContacts() {
  return {
    mutateAsync: async () => {
      await deleteAllContacts();
    },
    mutate: () => {
      deleteAllContacts().catch(console.error);
    },
    isPending: false
  };
}

// Hook for exporting contacts to CSV
export function useExportContacts() {
  return {
    exportToCSV: async (contacts?: Contact[]) => {
      // If no contacts provided, get all from database
      const contactsToExport = contacts || await db.contacts.toArray();
      
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