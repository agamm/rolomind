import { describe, it, expect } from 'vitest'
import { 
  findDuplicates, 
  mergeContacts, 
  areContactsIdentical 
} from '@/lib/contact-merger'
import { createTestContact } from '../../fixtures/contacts'

describe('Contact Merger', () => {
  describe('findDuplicates', () => {
    it('should find duplicates by name match', () => {
      const existing = [
        createTestContact({ id: '1', name: 'John Doe' }),
        createTestContact({ id: '2', name: 'Jane Smith' })
      ]
      
      const incoming = createTestContact({ name: 'John Doe' })
      const duplicates = findDuplicates(existing, incoming)
      
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].matchType).toBe('name')
      expect(duplicates[0].matchValue).toBe('John Doe')
      expect(duplicates[0].existing.id).toBe('1')
    })

    it('should find duplicates by email match', () => {
      const existing = [
        createTestContact({ 
          id: '1', 
          name: 'John Doe',
          contactInfo: {
            emails: ['john@example.com', 'john.doe@company.com'],
            phones: [],
            linkedinUrl: undefined,
            otherUrls: []
          }
        })
      ]
      
      const incoming = createTestContact({ 
        name: 'J. Doe',
        contactInfo: {
          emails: ['john@example.com'],
          phones: [],
          linkedinUrl: undefined,
          otherUrls: []
        }
      })
      
      const duplicates = findDuplicates(existing, incoming)
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].matchType).toBe('email')
      expect(duplicates[0].matchValue).toBe('john@example.com')
    })

    it('should find duplicates by phone match', () => {
      const existing = [
        createTestContact({ 
          id: '1',
          name: 'John Doe',
          contactInfo: {
            emails: [],
            phones: ['555-123-4567', '555-987-6543'],
            linkedinUrl: undefined,
            otherUrls: []
          }
        })
      ]
      
      const incoming = createTestContact({ 
        name: 'J. Doe', // Different name to avoid name match
        contactInfo: {
          emails: [],
          phones: ['(555) 123-4567'], // Different format
          linkedinUrl: undefined,
          otherUrls: []
        }
      })
      
      const duplicates = findDuplicates(existing, incoming)
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].matchType).toBe('phone')
    })

    it('should find duplicates by LinkedIn URL match', () => {
      const existing = [
        createTestContact({ 
          id: '1',
          name: 'John Doe',
          contactInfo: {
            emails: [],
            phones: [],
            linkedinUrl: 'https://linkedin.com/in/johndoe',
            otherUrls: []
          }
        })
      ]
      
      const incoming = createTestContact({ 
        name: 'John D.', // Different name to avoid name match
        contactInfo: {
          emails: [],
          phones: [],
          linkedinUrl: 'https://linkedin.com/in/johndoe',
          otherUrls: []
        }
      })
      
      const duplicates = findDuplicates(existing, incoming)
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].matchType).toBe('linkedin')
    })

    it('should handle case-insensitive name matching', () => {
      const existing = [createTestContact({ id: '1', name: 'John Doe' })]
      const incoming = createTestContact({ name: 'JOHN DOE' })
      
      const duplicates = findDuplicates(existing, incoming)
      expect(duplicates).toHaveLength(1)
    })

    it('should handle case-insensitive email matching', () => {
      const existing = [
        createTestContact({ 
          id: '1',
          contactInfo: {
            emails: ['John@Example.COM'],
            phones: [],
            linkedinUrl: undefined,
            otherUrls: []
          }
        })
      ]
      
      const incoming = createTestContact({ 
        contactInfo: {
          emails: ['john@example.com'],
          phones: [],
          linkedinUrl: undefined,
          otherUrls: []
        }
      })
      
      const duplicates = findDuplicates(existing, incoming)
      expect(duplicates).toHaveLength(1)
    })

    it('should remove duplicate matches for same contact', () => {
      const existing = [
        createTestContact({ 
          id: '1',
          name: 'John Doe',
          contactInfo: {
            emails: ['john@example.com'],
            phones: [],
            linkedinUrl: undefined,
            otherUrls: []
          }
        })
      ]
      
      const incoming = createTestContact({ 
        name: 'John Doe',
        contactInfo: {
          emails: ['john@example.com'],
          phones: [],
          linkedinUrl: undefined,
          otherUrls: []
        }
      })
      
      const duplicates = findDuplicates(existing, incoming)
      expect(duplicates).toHaveLength(1) // Not 2, even though matched by both name and email
    })
  })

  describe('areContactsIdentical', () => {
    it('should return true for identical contacts', () => {
      const contact1 = createTestContact({
        name: 'John Doe',
        company: 'Acme Corp',
        role: 'CEO',
        location: 'San Francisco',
        notes: 'Important client'
      })
      
      const contact2 = {
        name: 'John Doe',
        company: 'Acme Corp',
        role: 'CEO',
        location: 'San Francisco',
        notes: 'Important client',
        contactInfo: contact1.contactInfo
      }
      
      expect(areContactsIdentical(contact1, contact2)).toBe(true)
    })

    it('should return false for different names', () => {
      const contact1 = createTestContact({ name: 'John Doe' })
      const contact2 = { ...contact1, name: 'Jane Doe' }
      
      expect(areContactsIdentical(contact1, contact2)).toBe(false)
    })

    it('should handle whitespace normalization in notes', () => {
      const contact1 = createTestContact({ notes: 'Multiple   spaces\n\nand newlines' })
      const contact2 = { ...contact1, notes: 'Multiple spaces and newlines' }
      
      expect(areContactsIdentical(contact1, contact2)).toBe(true)
    })

    it('should compare arrays regardless of order', () => {
      const contact1 = createTestContact({
        contactInfo: {
          emails: ['a@example.com', 'b@example.com'],
          phones: ['111', '222'],
          linkedinUrl: undefined,
          otherUrls: []
        }
      })
      
      const contact2 = {
        ...contact1,
        contactInfo: {
          emails: ['b@example.com', 'a@example.com'],
          phones: ['222', '111'],
          linkedinUrl: undefined,
          otherUrls: []
        }
      }
      
      expect(areContactsIdentical(contact1, contact2)).toBe(true)
    })
  })

  describe('mergeContacts', () => {
    it('should merge contacts preserving existing data', () => {
      const existing = createTestContact({
        id: '1',
        name: 'John Doe',
        company: 'Acme Corp',
        role: 'CEO',
        contactInfo: {
          emails: ['john@acme.com'],
          phones: ['555-1234'],
          linkedinUrl: undefined,
          otherUrls: []
        },
        notes: 'Met at conference'
      })
      
      const incoming = {
        name: 'John Doe',
        company: 'Acme Corporation', // Slightly different
        location: 'San Francisco',
        contactInfo: {
          emails: ['john.doe@acme.com'], // Additional email
          phones: ['555-1234'], // Same phone
          linkedinUrl: 'https://linkedin.com/in/johndoe',
          otherUrls: []
        },
        notes: 'Technology leader'
      }
      
      const merged = mergeContacts(existing, incoming)
      
      expect(merged.id).toBe('1') // Keep existing ID
      expect(merged.name).toBe('John Doe')
      expect(merged.company).toBe('Acme Corporation') // Take incoming
      expect(merged.role).toBe('CEO') // Keep existing
      expect(merged.location).toBe('San Francisco') // Take incoming
      expect(merged.contactInfo.emails).toContain('john@acme.com')
      expect(merged.contactInfo.emails).toContain('john.doe@acme.com')
      expect(merged.contactInfo.phones).toHaveLength(1) // Deduplicated
      expect(merged.contactInfo.linkedinUrl).toBe('https://linkedin.com/in/johndoe')
    })

    it('should merge notes intelligently', () => {
      const existing = createTestContact({
        notes: 'Company: Acme Corp\nTitle: CEO\nMet at conference'
      })
      
      const incoming = {
        notes: 'Title: Chief Executive Officer\nLocation: San Francisco\nTechnology leader'
      }
      
      const merged = mergeContacts(existing, incoming)
      
      // Should keep longer title value and merge other content
      expect(merged.notes).toContain('Chief Executive Officer')
      expect(merged.notes).toContain('San Francisco')
      expect(merged.notes).toContain('Met at conference')
      expect(merged.notes).toContain('Technology leader')
    })

    it('should prefer longer name if incoming is longer', () => {
      const existing = createTestContact({ name: 'J. Doe' })
      const incoming = { name: 'John Doe' }
      
      const merged = mergeContacts(existing, incoming)
      expect(merged.name).toBe('John Doe')
    })

    it('should deduplicate other URLs', () => {
      const existing = createTestContact({
        contactInfo: {
          emails: [],
          phones: [],
          linkedinUrl: undefined,
          otherUrls: [
            { platform: 'twitter', url: 'https://twitter.com/john' },
            { platform: 'website', url: 'https://john.com' }
          ]
        }
      })
      
      const incoming = {
        contactInfo: {
          emails: [],
          phones: [],
          linkedinUrl: undefined,
          otherUrls: [
            { platform: 'twitter', url: 'https://twitter.com/john' }, // Duplicate
            { platform: 'github', url: 'https://github.com/john' } // New
          ]
        }
      }
      
      const merged = mergeContacts(existing, incoming)
      expect(merged.contactInfo.otherUrls).toHaveLength(3)
      expect(merged.contactInfo.otherUrls).toContainEqual(
        { platform: 'github', url: 'https://github.com/john' }
      )
    })

    it('should update timestamp', () => {
      const existing = createTestContact({
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      })
      
      const beforeMerge = new Date()
      const merged = mergeContacts(existing, {})
      
      expect(merged.createdAt).toEqual(existing.createdAt)
      expect(merged.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeMerge.getTime())
    })
  })
})