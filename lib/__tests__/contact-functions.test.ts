import { describe, it, expect } from 'vitest';
import {
  findMinimalContacts,
  findContactsWithoutNotes,
  getContactDataScore
} from '../contact-limits';
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

describe('Contact Functions', () => {
  describe('findMinimalContacts', () => {
    it('should find contacts with name only', () => {
      const contacts = [
        createTestContact({ id: '1', company: undefined, role: undefined, location: undefined }),
        createTestContact({ id: '2' }), // Full contact
      ];
      
      const minimal = findMinimalContacts(contacts);
      expect(minimal).toHaveLength(1);
      expect(minimal[0].id).toBe('1');
    });

    it('should find contacts with name + role only', () => {
      const contact = createTestContact({
        id: '1',
        company: undefined,
        location: undefined,
        notes: '',
        contactInfo: {
          phones: [],
          emails: [],
          linkedinUrl: undefined,
          otherUrls: []
        }
      });
      
      const minimal = findMinimalContacts([contact]);
      expect(minimal).toHaveLength(1);
    });

    it('should find contacts with name + one email', () => {
      const contact = createTestContact({
        id: '1',
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
      
      const minimal = findMinimalContacts([contact]);
      expect(minimal).toHaveLength(1);
    });

    it('should sort by data score (least data first)', () => {
      const contacts = [
        createTestContact({ id: '1' }), // Full contact
        createTestContact({ id: '2', company: undefined, role: undefined, location: undefined }), // Name only
        createTestContact({ id: '3', role: undefined, location: undefined }), // Name + company
      ];
      
      const minimal = findMinimalContacts(contacts);
      expect(minimal[0].id).toBe('2'); // Name only should be first
      expect(minimal[1].id).toBe('3'); // Name + company should be second
    });
  });

  describe('findContactsWithoutNotes', () => {
    it('should find contacts without notes', () => {
      const contacts = [
        createTestContact({ id: '1', notes: 'Has notes' }),
        createTestContact({ id: '2', notes: '' }),
        createTestContact({ id: '3', notes: undefined }),
        createTestContact({ id: '4', notes: '   ' }), // Whitespace only
      ];
      
      const withoutNotes = findContactsWithoutNotes(contacts);
      expect(withoutNotes).toHaveLength(3);
      expect(withoutNotes.map(c => c.id)).toEqual(['2', '3', '4']);
    });
  });

  describe('getContactDataScore', () => {
    it('should calculate correct scores', () => {
      const nameOnly = createTestContact({
        company: undefined,
        role: undefined,
        location: undefined,
        notes: '',
      });
      expect(getContactDataScore(nameOnly)).toBe(1);

      const withCompany = createTestContact({
        role: undefined,
        location: undefined,
        notes: '',
      });
      expect(getContactDataScore(withCompany)).toBe(2);

      const withNotes = createTestContact({
        notes: 'Some notes',
      });
      expect(getContactDataScore(withNotes)).toBe(6); // name + company + role + location + notes(2)
    });
  });
});