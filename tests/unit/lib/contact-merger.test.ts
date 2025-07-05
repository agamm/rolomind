import { describe, it, expect } from 'vitest'
import { 
  findDuplicates, 
  mergeContacts, 
  areContactsIdentical,
  hasLessOrEqualInformation 
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

    it('should ignore LinkedIn connection dates in notes', () => {
      const contact1 = createTestContact({
        name: 'Jerry Lesnik',
        company: 'Community',
        role: 'Povio',
        location: 'San Francisco',
        notes: 'LinkedIn connected: 9-May-25',
        contactInfo: {
          emails: [],
          phones: [],
          linkedinUrl: 'https://linkedin.com/in/jerrylesnik',
          otherUrls: []
        }
      })
      
      const contact2 = createTestContact({
        name: 'Jerry Lesnik',
        company: 'Community',
        role: 'Povio',
        location: 'San Francisco',
        notes: 'LinkedIn connected: 09 May 2025',
        contactInfo: {
          emails: [],
          phones: [],
          linkedinUrl: 'https://linkedin.com/in/jerrylesnik',
          otherUrls: []
        }
      })
      
      expect(areContactsIdentical(contact1, contact2)).toBe(true)
    })

    it('should ignore LinkedIn connection dates but still compare other notes', () => {
      const contact1 = createTestContact({
        name: 'Jerry Lesnik',
        notes: 'LinkedIn connected: 9-May-25\nImportant client'
      })
      
      const contact2 = createTestContact({
        name: 'Jerry Lesnik',
        notes: 'LinkedIn connected: 09 May 2025\nImportant client'
      })
      
      expect(areContactsIdentical(contact1, contact2)).toBe(true)
      
      // But should still detect differences in other notes
      const contact3 = createTestContact({
        name: 'Jerry Lesnik',
        notes: 'LinkedIn connected: 09 May 2025\nDifferent note'
      })
      
      expect(areContactsIdentical(contact1, contact3)).toBe(false)
    })

    it('should allow auto-merge when existing contact has no LinkedIn URL but incoming does', () => {
      const contact1 = createTestContact({
        name: 'Hanan Gelbendorf',
        company: 'Umbrella',
        role: 'VP of Marketing',
        contactInfo: {
          emails: [],
          phones: [],
          linkedinUrl: undefined, // No LinkedIn URL
          otherUrls: []
        }
      })
      
      const contact2 = createTestContact({
        name: 'Hanan Gelbendorf',
        company: 'Umbrella',
        role: 'VP of Marketing',
        contactInfo: {
          emails: [],
          phones: [],
          linkedinUrl: 'https://www.linkedin.com/in/gelbendorf', // Has LinkedIn URL
          otherUrls: []
        }
      })
      
      expect(areContactsIdentical(contact1, contact2)).toBe(true)
    })

    it('should not be identical if both have different LinkedIn URLs', () => {
      const contact1 = createTestContact({
        name: 'John Doe',
        contactInfo: {
          emails: [],
          phones: [],
          linkedinUrl: 'https://linkedin.com/in/johndoe1',
          otherUrls: []
        }
      })
      
      const contact2 = createTestContact({
        name: 'John Doe',
        contactInfo: {
          emails: [],
          phones: [],
          linkedinUrl: 'https://linkedin.com/in/johndoe2',
          otherUrls: []
        }
      })
      
      expect(areContactsIdentical(contact1, contact2)).toBe(false)
    })
  })

  describe('hasLessOrEqualInformation', () => {
    it('should return true when incoming contact has identical information', () => {
      const contact1 = createTestContact({
        name: 'Noam Nissan',
        company: 'CrowdStrike',
        role: 'Software Engineer',
        location: 'Israel',
        notes: '- Birthday: 6/18/2023\n- LinkedIn connected: 21 May 2025'
      })
      
      const contact2 = createTestContact({
        name: 'Noam Nissan',
        company: 'CrowdStrike',
        role: 'Software Engineer',
        location: 'Israel',
        notes: 'LinkedIn connected: 21 May 2025'
      })
      
      expect(hasLessOrEqualInformation(contact1, contact2)).toBe(true)
    })

    it('should return true when incoming contact has less information', () => {
      const existing = createTestContact({
        name: 'Noam Nissan',
        company: 'CrowdStrike',
        role: 'Software Engineer',
        location: 'Israel',
        notes: '- Birthday: 6/18/2023\n- LinkedIn connected: 21 May 2025',
        contactInfo: {
          emails: ['noam@crowdstrike.com'],
          phones: ['123-456-7890'],
          linkedinUrl: 'https://linkedin.com/in/noam',
          otherUrls: []
        }
      })
      
      const incoming = createTestContact({
        name: 'Noam Nissan',
        company: 'CrowdStrike',
        role: 'Software Engineer',
        location: 'Israel',
        notes: 'LinkedIn connected: 21 May 2025',
        contactInfo: {
          emails: [],
          phones: [],
          linkedinUrl: undefined,
          otherUrls: []
        }
      })
      
      expect(hasLessOrEqualInformation(existing, incoming)).toBe(true)
    })

    it('should return false when incoming contact has additional information', () => {
      const existing = createTestContact({
        name: 'Noam Nissan',
        company: 'CrowdStrike',
        role: 'Software Engineer',
        notes: 'LinkedIn connected: 21 May 2025'
      })
      
      const incoming = createTestContact({
        name: 'Noam Nissan',
        company: 'CrowdStrike',
        role: 'Software Engineer',
        notes: '- Birthday: 6/18/2023\n- LinkedIn connected: 21 May 2025'
      })
      
      expect(hasLessOrEqualInformation(existing, incoming)).toBe(false)
    })

    it('should return false when incoming has different company', () => {
      const existing = createTestContact({
        name: 'John Doe',
        company: 'Company A',
        role: 'Engineer'
      })
      
      const incoming = createTestContact({
        name: 'John Doe',
        company: 'Company B',
        role: 'Engineer'
      })
      
      expect(hasLessOrEqualInformation(existing, incoming)).toBe(false)
    })

    it('should return true when incoming has no company but existing does', () => {
      const existing = createTestContact({
        name: 'John Doe',
        company: 'Company A',
        role: 'Engineer'
      })
      
      const incoming = createTestContact({
        name: 'John Doe',
        company: undefined,
        role: 'Engineer'
      })
      
      expect(hasLessOrEqualInformation(existing, incoming)).toBe(true)
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

  describe('Edge Cases and Performance', () => {
    it('should handle empty contact lists', () => {
      const incoming = createTestContact({ name: 'John Doe' })
      const duplicates = findDuplicates([], incoming)
      
      expect(duplicates).toHaveLength(0)
    })

    it('should handle contacts with no identifying information', () => {
      const existing = [
        createTestContact({ 
          id: '1',
          name: '',
          contactInfo: {
            emails: [],
            phones: [],
            linkedinUrl: undefined,
            otherUrls: []
          }
        })
      ]
      
      const incoming = createTestContact({ 
        name: '',
        contactInfo: {
          emails: [],
          phones: [],
          linkedinUrl: undefined,
          otherUrls: []
        }
      })
      
      const duplicates = findDuplicates(existing, incoming)
      expect(duplicates).toHaveLength(0) // Should not match empty names
    })

    it('should handle exact phone number matches', () => {
      const existing = [
        createTestContact({ 
          id: '1',
          contactInfo: {
            emails: [],
            phones: ['555-123-4567'],
            linkedinUrl: undefined,
            otherUrls: []
          }
        })
      ]
      
      const incoming = createTestContact({ 
        name: 'Different Name',
        contactInfo: {
          emails: [],
          phones: ['555-123-4567'], // Exact match
          linkedinUrl: undefined,
          otherUrls: []
        }
      })
      
      const duplicates = findDuplicates(existing, incoming)
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].matchType).toBe('phone')
    })

    it('should handle exact LinkedIn URL matches', () => {
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
        name: 'Different Name',
        contactInfo: {
          emails: [],
          phones: [],
          linkedinUrl: 'https://linkedin.com/in/johndoe', // Exact match
          otherUrls: []
        }
      })
      
      const duplicates = findDuplicates(existing, incoming)
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].matchType).toBe('linkedin')
    })

    it('should handle multiple duplicates across different contacts', () => {
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
        }),
        createTestContact({ 
          id: '2', 
          name: 'Jane Smith',
          contactInfo: {
            emails: ['jane@example.com'],
            phones: ['555-1234'],
            linkedinUrl: undefined,
            otherUrls: []
          }
        })
      ]
      
      // Incoming contact that matches both existing contacts by different criteria
      const incoming = createTestContact({ 
        name: 'John Doe', // Matches contact 1 by name
        contactInfo: {
          emails: ['different@example.com'],
          phones: ['555-1234'], // Matches contact 2 by phone
          linkedinUrl: undefined,
          otherUrls: []
        }
      })
      
      const duplicates = findDuplicates(existing, incoming)
      expect(duplicates).toHaveLength(2) // Should find both duplicates
      
      const matchTypes = duplicates.map(d => d.matchType)
      expect(matchTypes).toContain('name')
      expect(matchTypes).toContain('phone')
    })

    it('should handle very large contact lists efficiently', () => {
      // Create 1000 existing contacts
      const existing = Array.from({ length: 1000 }, (_, i) => 
        createTestContact({ 
          id: `contact-${i}`,
          name: `Contact ${i}`,
          contactInfo: {
            emails: [`contact${i}@example.com`],
            phones: [],
            linkedinUrl: undefined,
            otherUrls: []
          }
        })
      )
      
      const incoming = createTestContact({ 
        name: 'Contact 500', // Should match existing contact 500
        contactInfo: {
          emails: ['different@example.com'],
          phones: [],
          linkedinUrl: undefined,
          otherUrls: []
        }
      })
      
      const startTime = Date.now()
      const duplicates = findDuplicates(existing, incoming)
      const duration = Date.now() - startTime
      
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].existing.id).toBe('contact-500')
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
    })

    it('should merge contacts with unicode characters correctly', () => {
      const existing = createTestContact({
        id: '1',
        name: 'José García',
        company: 'Compañía Española',
        notes: 'Nötes with ümlauts and åccents'
      })
      
      const incoming = {
        name: 'José García',
        company: 'Compañía Española S.A.',
        notes: 'Additional notes with émojis 🚀'
      }
      
      const merged = mergeContacts(existing, incoming)
      
      expect(merged.name).toBe('José García')
      expect(merged.company).toBe('Compañía Española S.A.')
      expect(merged.notes).toContain('ümlauts')
      expect(merged.notes).toContain('🚀')
    })

    it('should handle merging contacts with null/undefined values', () => {
      const existing = createTestContact({
        id: '1',
        name: 'John Doe',
        company: 'Acme Corp',
        role: undefined,
        location: undefined
      })
      
      const incoming = {
        name: 'John Doe',
        company: undefined,
        role: 'CEO',
        location: 'San Francisco'
      }
      
      const merged = mergeContacts(existing, incoming)
      
      expect(merged.name).toBe('John Doe')
      expect(merged.company).toBe('Acme Corp') // Keep existing when incoming is undefined
      expect(merged.role).toBe('CEO') // Take incoming when existing is undefined
      expect(merged.location).toBe('San Francisco') // Take incoming when existing is undefined
    })

    it('should preserve source information correctly during merge', () => {
      const existing = createTestContact({
        id: '1',
        name: 'John Doe',
        source: 'linkedin'
      })
      
      const incoming = {
        name: 'John Doe',
        source: 'google' as const
      }
      
      const merged = mergeContacts(existing, incoming)
      
      // Should keep the original source
      expect(merged.source).toBe('linkedin')
    })
  })
})