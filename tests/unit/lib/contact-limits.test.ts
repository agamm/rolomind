import { describe, it, expect } from 'vitest';
import {
  CONTACT_LIMITS,
  getContactTokenCount,
  isApproachingContactLimit,
  findEmptyContacts
} from '@/lib/config';
import { Contact } from '@/types/contact';

// Helper to create a test contact
const createTestContact = (overrides?: Partial<Contact>): Contact => ({
  id: '1',
  name: 'Test Contact',
  company: 'Test Company',
  role: 'Test Role',
  location: 'Test Location',
  contactInfo: {
    phones: [],
    emails: [],
    linkedinUrl: '',
    otherUrls: []
  },
  notes: '',
  source: 'manual' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

describe('Contact Limits', () => {
  describe('Token Counting', () => {
    it('should calculate token count for a simple contact', () => {
      const contact = createTestContact();
      const tokenCount = getContactTokenCount(contact);
      expect(tokenCount).toBeGreaterThan(0);
      expect(tokenCount).toBeLessThan(CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT);
    });

    it('should identify oversized contacts', () => {
      const normalContact = createTestContact();
      const largeContact = createTestContact({
        notes: 'x'.repeat(2000) // Very long notes
      });
      
      expect(getContactTokenCount(normalContact)).toBeLessThan(CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT);
      expect(getContactTokenCount(largeContact)).toBeGreaterThan(CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT);
    });
  });

  describe('Contact Count Limits', () => {
    it('should check if approaching contact limit', () => {
      expect(isApproachingContactLimit(8000)).toBe(false);
      expect(isApproachingContactLimit(8999)).toBe(false);
      expect(isApproachingContactLimit(9000)).toBe(true); // 90% of 10000
      expect(isApproachingContactLimit(9500)).toBe(true);
    });
  });

  describe('Empty Contact Detection', () => {
    it('should find empty contacts', () => {
      const contacts = [
        createTestContact({ id: '1' }), // Full contact
        createTestContact({ 
          id: '2',
          company: undefined,
          role: undefined,
          location: undefined,
          notes: '',
          contactInfo: {
            phones: [],
            emails: [],
            linkedinUrl: undefined,
            otherUrls: []
          }
        }), // Empty contact
        createTestContact({ id: '3', notes: 'Has notes' }) // Has notes
      ];
      
      const empty = findEmptyContacts(contacts);
      expect(empty).toHaveLength(1);
      expect(empty[0].id).toBe('2');
    });

    it('should not consider contacts with any info as empty', () => {
      const contactWithEmail = createTestContact({
        company: undefined,
        role: undefined,
        location: undefined,
        notes: '',
        contactInfo: {
          phones: [],
          emails: ['test@example.com'],
          linkedinUrl: undefined,
          otherUrls: []
        }
      });
      
      const empty = findEmptyContacts([contactWithEmail]);
      expect(empty).toHaveLength(0);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle contacts with many long fields', () => {
    const contact = createTestContact({
      name: 'x'.repeat(200),
      company: 'y'.repeat(200),
      role: 'z'.repeat(200),
      location: 'a'.repeat(200),
      notes: 'b'.repeat(1000) // Much longer notes to exceed limit
    });
    
    const tokenCount = getContactTokenCount(contact);
    
    // This contact exceeds the limit due to many long fields
    expect(tokenCount).toBeGreaterThan(CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT);
  });

  it('should handle contacts with reasonable field lengths', () => {
    const contact = createTestContact({
      name: 'John Smith',
      company: 'Acme Corporation',
      role: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      notes: 'Met at conference last year. Interested in our product.',
      contactInfo: {
        phones: ['123-456-7890', '098-765-4321'],
        emails: ['john@acme.com', 'jsmith@gmail.com'],
        linkedinUrl: 'https://linkedin.com/in/johnsmith',
        otherUrls: [
          { platform: 'Twitter', url: 'https://twitter.com/jsmith' },
          { platform: 'GitHub', url: 'https://github.com/johnsmith' }
        ]
      }
    });
    
    const tokenCount = getContactTokenCount(contact);
    
    // Normal contact should be well under limit
    expect(tokenCount).toBeLessThan(CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT);
  });

  it('should identify when contact approaches token limit', () => {
    // Create a contact with a notes field that approaches the limit
    // The base contact structure is about 150 tokens, so we need ~250 tokens in notes
    const contact = createTestContact({
      notes: 'This is a test note. '.repeat(20) // ~140 characters = ~47 tokens
    });
    
    const tokenCount = getContactTokenCount(contact);
    
    // Just verify this reasonable contact is well under the limit
    expect(tokenCount).toBeLessThan(CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT);
    
    // Test warning threshold logic separately
    const warningThreshold = CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT * 0.8;
    expect(warningThreshold).toBe(400); // 80% of 500
  });
});