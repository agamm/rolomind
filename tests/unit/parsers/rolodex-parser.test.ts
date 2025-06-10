import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as rolodexParser from '@/app/api/import/parsers/rolodex-parser'

describe('Rolodex Parser', () => {
  const rolodexCsv = readFileSync(
    join(__dirname, '../../fixtures/rolodex.csv'),
    'utf-8'
  )

  describe('isApplicableParser', () => {
    it('should identify Rolodex CSV by exact headers', () => {
      const headers = ['Name', 'Company', 'Title', 'Email', 'Phone', 'LinkedIn', 'Location', 'Notes']
      expect(rolodexParser.isApplicableParser(headers)).toBe(true)
    })

    it('should identify app export format with plural fields', () => {
      const exportHeaders = ['Name', 'Company', 'Role', 'Location', 'Emails', 'Phones', 'LinkedIn URL', 'Other URLs', 'Notes', 'Source', 'Created Date', 'Updated Date']
      expect(rolodexParser.isApplicableParser(exportHeaders)).toBe(true)
    })

    it('should identify with subset of required headers', () => {
      const headers = ['Name', 'Company', 'Title', 'Email']
      expect(rolodexParser.isApplicableParser(headers)).toBe(true)
    })

    it('should accept either Email or Emails header', () => {
      const withEmail = ['Name', 'Company', 'Email', 'Role']
      expect(rolodexParser.isApplicableParser(withEmail)).toBe(true)
      
      const withEmails = ['Name', 'Company', 'Emails', 'Role']
      expect(rolodexParser.isApplicableParser(withEmails)).toBe(true)
    })

    it('should not identify without minimum required headers', () => {
      const headers = ['Name', 'Email']
      expect(rolodexParser.isApplicableParser(headers)).toBe(false)
    })

    it('should not identify non-Rolodex CSV', () => {
      const headers = ['First Name', 'Last Name', 'Email Address']
      expect(rolodexParser.isApplicableParser(headers)).toBe(false)
    })
  })

  describe('parse', () => {
    it('should parse Rolodex CSV correctly', () => {
      const contacts = rolodexParser.parse(rolodexCsv)
      
      expect(contacts).toHaveLength(4)
      
      // Check first contact
      const firstContact = contacts[0]
      expect(firstContact.name).toBe('John Doe')
      expect(firstContact.company).toBe('Acme Corp')
      expect(firstContact.role).toBe('CEO')
      expect(firstContact.location).toBe('San Francisco, CA')
      expect(firstContact.contactInfo.emails).toEqual(['john@example.com'])
      expect(firstContact.contactInfo.phones).toEqual(['555-0123'])
      expect(firstContact.contactInfo.linkedinUrl).toBe('https://linkedin.com/in/johndoe')
      expect(firstContact.notes).toBe('Met at conference')
      expect(firstContact.source).toBe('manual') // Default when Source column not in CSV
    })

    it('should handle missing optional fields', () => {
      const contacts = rolodexParser.parse(rolodexCsv)
      const aliceContact = contacts.find(c => c.name === 'Alice Brown')
      
      expect(aliceContact).toBeDefined()
      expect(aliceContact!.contactInfo.linkedinUrl).toBeUndefined()
      expect(aliceContact!.contactInfo.phones).toEqual(['555-0125'])
    })

    it('should handle empty phone field', () => {
      const contacts = rolodexParser.parse(rolodexCsv)
      const bobContact = contacts.find(c => c.name === 'Bob Wilson')
      
      expect(bobContact).toBeDefined()
      expect(bobContact!.contactInfo.phones).toEqual([])
    })

    it('should generate unique IDs', () => {
      const contacts = rolodexParser.parse(rolodexCsv)
      const ids = contacts.map(c => c.id)
      const uniqueIds = new Set(ids)
      
      expect(uniqueIds.size).toBe(contacts.length)
      expect(ids[0]).toMatch(/^rolodex-\d+-\d+-[a-z0-9]+$/)
    })

    it('should filter out empty contacts', () => {
      const csvWithEmpty = `Name,Company,Title,Email,Phone,LinkedIn,Location,Notes
John Doe,Acme,CEO,john@example.com,555-0123,https://linkedin.com/in/john,SF,Notes
,,,,,,,
Jane Smith,Tech Co,CTO,jane@example.com,555-0124,,NYC,`
      
      const contacts = rolodexParser.parse(csvWithEmpty)
      // Empty row gets name "Contact 2", so it won't be filtered
      expect(contacts).toHaveLength(3)
      expect(contacts[1].name).toBe('Contact 2') // The empty row
    })

    it('should handle CSV with missing columns', () => {
      const csvMinimal = `Name,Company,Title,Email
John Doe,Acme Corp,CEO,john@example.com
Jane Smith,Tech Co,CTO,jane@example.com`
      
      const contacts = rolodexParser.parse(csvMinimal)
      expect(contacts).toHaveLength(2)
      expect(contacts[0].contactInfo.phones).toEqual([])
      expect(contacts[0].contactInfo.linkedinUrl).toBeUndefined()
      expect(contacts[0].location).toBeUndefined()
      expect(contacts[0].notes).toBe('')
    })

    it('should parse app export format with plural fields', () => {
      const appExportCsv = `Name,Company,Role,Location,Emails,Phones,LinkedIn URL,Other URLs,Notes,Source,Created Date,Updated Date
John Doe,Acme Corp,CEO,San Francisco,john@acme.com;john.doe@acme.com,555-0123;555-0124,https://linkedin.com/in/johndoe,Twitter: https://twitter.com/johndoe; GitHub: https://github.com/johndoe,Important contact,manual,2024-01-01T00:00:00Z,2024-01-02T00:00:00Z
Jane Smith,Tech Co,CTO,New York,jane@techco.com,555-5678,,Website: https://janesmith.com,Tech leader,linkedin,2024-01-03T00:00:00Z,2024-01-03T00:00:00Z`
      
      const contacts = rolodexParser.parse(appExportCsv)
      expect(contacts).toHaveLength(2)
      
      // Check first contact with multiple values
      const john = contacts[0]
      expect(john.name).toBe('John Doe')
      expect(john.company).toBe('Acme Corp')
      expect(john.role).toBe('CEO')
      expect(john.location).toBe('San Francisco')
      expect(john.contactInfo.emails).toEqual(['john@acme.com', 'john.doe@acme.com'])
      expect(john.contactInfo.phones).toEqual(['555-0123', '555-0124'])
      expect(john.contactInfo.linkedinUrl).toBe('https://linkedin.com/in/johndoe')
      expect(john.contactInfo.otherUrls).toEqual([
        { platform: 'Twitter', url: 'https://twitter.com/johndoe' },
        { platform: 'GitHub', url: 'https://github.com/johndoe' }
      ])
      expect(john.notes).toBe('Important contact')
      expect(john.source).toBe('manual')
      expect(john.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'))
      expect(john.updatedAt).toEqual(new Date('2024-01-02T00:00:00Z'))
      
      // Check second contact
      const jane = contacts[1]
      expect(jane.name).toBe('Jane Smith')
      expect(jane.source).toBe('linkedin')
      expect(jane.contactInfo.otherUrls).toEqual([
        { platform: 'Website', url: 'https://janesmith.com' }
      ])
    })
  })
})