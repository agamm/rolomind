import { Contact } from '@/types/contact';
import { estimateTokenCount } from './token-utils';

// Contact storage limits
export const CONTACT_LIMITS = {
  MAX_CONTACTS: 10_000,
  MAX_TOKENS_PER_CONTACT: 500,
  WARNING_THRESHOLD: 0.9, // Warning at 90% capacity
  TOKEN_WARNING_THRESHOLD: 0.8, // Warning at 80% of token limit
} as const;

// Estimate tokens for a single contact
export function getContactTokenCount(contact: Contact): number {
  const contactString = JSON.stringify(contact);
  return estimateTokenCount(contactString);
}

// Check if approaching contact limit
export function isApproachingContactLimit(currentCount: number): boolean {
  return currentCount >= (CONTACT_LIMITS.MAX_CONTACTS * CONTACT_LIMITS.WARNING_THRESHOLD);
}

// Get empty or minimal contacts (good candidates for deletion)
export function findEmptyContacts(contacts: Contact[]): Contact[] {
  return contacts.filter(contact => {
    const hasMinimalInfo = 
      !contact.company && 
      !contact.role && 
      !contact.location &&
      (!contact.notes || contact.notes.trim().length === 0) &&
      contact.contactInfo.phones.length === 0 &&
      contact.contactInfo.emails.length === 0 &&
      !contact.contactInfo.linkedinUrl;
    
    return hasMinimalInfo;
  });
}

// Calculate how much data a contact has (for sorting)
export function getContactDataScore(contact: Contact): number {
  let score = 0;
  
  // Basic fields (1 point each)
  if (contact.name) score += 1;
  if (contact.company) score += 1;
  if (contact.role) score += 1;
  if (contact.location) score += 1;
  if (contact.notes && contact.notes.trim().length > 0) score += 2; // Notes are worth more
  
  // Contact info (1 point each)
  score += contact.contactInfo.emails.length;
  score += contact.contactInfo.phones.length;
  if (contact.contactInfo.linkedinUrl) score += 1;
  score += (contact.contactInfo.otherUrls?.length || 0);
  
  return score;
}

// Find minimal contacts (name only, name + one field, or name + role only)
export function findMinimalContacts(contacts: Contact[]): Contact[] {
  return contacts.filter(contact => {
    const score = getContactDataScore(contact);
    // Score of 1 = name only
    // Score of 2 = name + one other field (email, phone, company, etc)
    if (score <= 2) return true;
    
    // Special case: name + role only (no other data)
    if (contact.name && contact.role && 
        !contact.company && 
        !contact.location && 
        (!contact.notes || contact.notes.trim().length === 0) &&
        contact.contactInfo.emails.length === 0 &&
        contact.contactInfo.phones.length === 0 &&
        !contact.contactInfo.linkedinUrl &&
        contact.contactInfo.otherUrls.length === 0) {
      return true;
    }
    
    return false;
  }).sort((a, b) => {
    // Sort by data score (least data first)
    return getContactDataScore(a) - getContactDataScore(b);
  });
}

// Find contacts without notes
export function findContactsWithoutNotes(contacts: Contact[]): Contact[] {
  return contacts.filter(contact => {
    return !contact.notes || contact.notes.trim().length === 0;
  });
}



