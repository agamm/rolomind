import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as linkedinParser from '@/app/api/import/parsers/linkedin-parser'
import * as googleParser from '@/app/api/import/parsers/google-parser'
import * as rolodexParser from '@/app/api/import/parsers/rolodex-parser'
import * as customParser from '@/app/api/import/parsers/custom-parser'
import { findDuplicates } from '@/lib/contact-merger'
import { sampleContacts } from '../../fixtures/contacts'

// Mock the llm-normalizer for custom parser
vi.mock('@/app/api/import/parsers/llm-normalizer', () => ({
  normalizeCsvBatch: vi.fn()
}))

describe('Import Parsers - Simplified Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Set up default mock for custom parser
    const { normalizeCsvBatch } = await import('@/app/api/import/parsers/llm-normalizer')
    vi.mocked(normalizeCsvBatch).mockImplementation(async (rows) => ({
      normalized: rows.slice(0, 2).map((row, index) => ({
        id: `custom-${Date.now()}-${index}`,
        name: `Contact ${index + 1}`,
        company: 'Test Company',
        role: 'Test Role',
        location: 'Test Location',
        contactInfo: {
          emails: [`contact${index}@test.com`],
          phones: [],
          linkedinUrl: undefined,
          otherUrls: []
        },
        notes: 'Imported via custom parser',
        source: 'manual' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      errors: []
    }))
  })

  describe('Parser Detection', () => {
    it('should correctly identify LinkedIn CSV', () => {
      const linkedinHeaders = ['First Name', 'Last Name', 'Email Address', 'Company', 'Position', 'Connected On', 'URL']
      expect(linkedinParser.isApplicableParser(linkedinHeaders)).toBe(true)
      expect(googleParser.isApplicableParser(linkedinHeaders)).toBe(false)
      expect(rolodexParser.isApplicableParser(linkedinHeaders)).toBe(false)
    })

    it('should correctly identify Google CSV', () => {
      // Test both old and new Google formats
      const googleHeadersOld = ['Name', 'Given Name', 'Family Name', 'E-mail 1 - Value', 'Phone 1 - Value', 'Organization 1 - Name']
      expect(googleParser.isApplicableParser(googleHeadersOld)).toBe(true)
      expect(linkedinParser.isApplicableParser(googleHeadersOld)).toBe(false)
      expect(rolodexParser.isApplicableParser(googleHeadersOld)).toBe(false)
      
      const googleHeadersNew = ['First Name', 'Middle Name', 'Last Name', 'E-mail 1 - Value', 'Phone 1 - Value', 'Organization Name']
      expect(googleParser.isApplicableParser(googleHeadersNew)).toBe(true)
      expect(linkedinParser.isApplicableParser(googleHeadersNew)).toBe(false)
      expect(rolodexParser.isApplicableParser(googleHeadersNew)).toBe(false)
    })

    it('should correctly identify Rolodex CSV', () => {
      const rolodexHeaders = ['Name', 'Company', 'Title', 'Email', 'Phone', 'LinkedIn', 'Location', 'Notes']
      expect(rolodexParser.isApplicableParser(rolodexHeaders)).toBe(true)
      expect(linkedinParser.isApplicableParser(rolodexHeaders)).toBe(false)
      expect(googleParser.isApplicableParser(rolodexHeaders)).toBe(false)
      
      // Also test app export format
      const appExportHeaders = ['Name', 'Company', 'Role', 'Location', 'Emails', 'Phones', 'LinkedIn URL', 'Other URLs', 'Notes', 'Source', 'Created Date', 'Updated Date']
      expect(rolodexParser.isApplicableParser(appExportHeaders)).toBe(true)
      expect(linkedinParser.isApplicableParser(appExportHeaders)).toBe(false)
      expect(googleParser.isApplicableParser(appExportHeaders)).toBe(false)
    })

    it('should fall back to custom parser for unknown formats', () => {
      const unknownHeaders = ['Full Name', 'Business', 'Job Title', 'Contact Email']
      expect(linkedinParser.isApplicableParser(unknownHeaders)).toBe(false)
      expect(googleParser.isApplicableParser(unknownHeaders)).toBe(false)
      expect(rolodexParser.isApplicableParser(unknownHeaders)).toBe(false)
      // Custom parser always returns true as it's the fallback
      expect(customParser.isApplicableParser()).toBe(true)
    })
  })

  describe('CSV Parsing', () => {
    it('should parse LinkedIn CSV and return normalized contacts', () => {
      const csvContent = `First Name,Last Name,Email Address,Company,Position,Connected On,URL
John,Doe,john@example.com,Acme Corp,CEO,15-Jan-24,https://linkedin.com/in/johndoe
Jane,Smith,jane@example.com,Tech Co,CTO,20-Feb-24,https://linkedin.com/in/janesmith`

      const contacts = linkedinParser.parse(csvContent)
      
      expect(contacts).toHaveLength(2)
      expect(contacts[0].name).toBe('John Doe')
      expect(contacts[0].company).toBe('Acme Corp')
      expect(contacts[0].role).toBe('CEO')
      expect(contacts[0].source).toBe('linkedin')
      expect(contacts[0].contactInfo.emails).toEqual(['john@example.com'])
    })

    it('should parse Google CSV and return normalized contacts', () => {
      const csvContent = `Name,Given Name,Family Name,E-mail 1 - Value,Phone 1 - Value,Organization 1 - Name,Organization 1 - Title
John Doe,John,Doe,john@example.com,555-0123,Acme Corp,CEO
Jane Smith,Jane,Smith,jane@example.com,555-0124,Tech Co,CTO`

      const contacts = googleParser.parse(csvContent)
      
      expect(contacts).toHaveLength(2)
      expect(contacts[0].name).toBe('John Doe')
      expect(contacts[0].company).toBe('Acme Corp')
      expect(contacts[0].role).toBe('CEO')
      expect(contacts[0].source).toBe('google')
    })

    it('should parse Rolodex CSV and return normalized contacts', () => {
      const csvContent = `Name,Company,Title,Email,Phone,LinkedIn,Location,Notes
John Doe,Acme Corp,CEO,john@example.com,555-0123,https://linkedin.com/in/johndoe,San Francisco,Important contact
Jane Smith,Tech Co,CTO,jane@example.com,555-0124,https://linkedin.com/in/janesmith,New York,Tech leader`

      const contacts = rolodexParser.parse(csvContent)
      
      expect(contacts).toHaveLength(2)
      expect(contacts[0].name).toBe('John Doe')
      expect(contacts[0].location).toBe('San Francisco')
      expect(contacts[0].notes).toBe('Important contact')
      expect(contacts[0].source).toBe('manual')
    })
  })

  describe('Duplicate Detection', () => {
    it('should detect duplicates by email', () => {
      const existingContacts = [sampleContacts[0]] // John Doe with john@techstartup.com
      const incomingContact = {
        ...sampleContacts[0],
        id: 'new-id',
        name: 'J. Doe', // Different name
        company: 'Different Company'
      }

      const duplicates = findDuplicates(existingContacts, incomingContact)
      
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].matchType).toBe('email')
      expect(duplicates[0].existing.id).toBe(sampleContacts[0].id)
    })

    it('should detect duplicates by name', () => {
      const existingContacts = [sampleContacts[0]]
      const incomingContact = {
        ...sampleContacts[0],
        id: 'new-id',
        contactInfo: {
          ...sampleContacts[0].contactInfo,
          emails: ['different@email.com'] // Different email
        }
      }

      const duplicates = findDuplicates(existingContacts, incomingContact)
      
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].matchType).toBe('name')
    })

    it('should not detect false duplicates', () => {
      const existingContacts = [sampleContacts[0]]
      const incomingContact = sampleContacts[1] // Jane Smith - completely different

      const duplicates = findDuplicates(existingContacts, incomingContact)
      
      expect(duplicates).toHaveLength(0)
    })
  })

  describe('Import Flow Logic', () => {
    it('should select correct parser based on headers', () => {
      const testCases = [
        {
          headers: ['First Name', 'Last Name', 'Email Address', 'Company', 'Connected On', 'URL'],
          expectedParser: 'linkedin'
        },
        {
          headers: ['First Name', 'Last Name', 'E-mail 1 - Value', 'Phone 1 - Value'],
          expectedParser: 'google'
        },
        {
          headers: ['Name', 'Company', 'Title', 'Email'],
          expectedParser: 'rolodex'
        },
        {
          headers: ['Full Name', 'Business', 'Contact'],
          expectedParser: 'custom'
        }
      ]

      testCases.forEach(({ headers, expectedParser }) => {
        let detectedParser = 'custom'
        
        if (linkedinParser.isApplicableParser(headers)) {
          detectedParser = 'linkedin'
        } else if (googleParser.isApplicableParser(headers)) {
          detectedParser = 'google'
        } else if (rolodexParser.isApplicableParser(headers)) {
          detectedParser = 'rolodex'
        }
        
        expect(detectedParser).toBe(expectedParser)
      })
    })

    it('should handle empty CSV gracefully', () => {
      const emptyCsv = 'Name,Email,Company\n'
      
      const contacts = rolodexParser.parse(emptyCsv)
      expect(contacts).toHaveLength(0)
    })

    it('should handle malformed CSV data', () => {
      const malformedCsv = `Name,Email,Company
John Doe,john@example.com,Acme
,,
Jane Smith,jane@example.com,Tech Co`

      const contacts = rolodexParser.parse(malformedCsv)
      
      // Should parse valid rows and skip empty ones
      expect(contacts).toHaveLength(3) // Including "Contact 2" for empty row
      expect(contacts[0].name).toBe('John Doe')
      expect(contacts[1].name).toBe('Contact 2')
      expect(contacts[2].name).toBe('Jane Smith')
    })
  })
})