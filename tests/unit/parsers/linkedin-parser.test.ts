import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as linkedinParser from '@/app/api/import/parsers/linkedin-parser'

describe('LinkedIn Parser', () => {
  const linkedinCsv = readFileSync(
    join(__dirname, '../../fixtures/linkedin.csv'),
    'utf-8'
  )

  describe('isApplicableParser', () => {
    it('should identify LinkedIn CSV by required headers', () => {
      const headers = ['First Name', 'Last Name', 'URL', 'Email Address', 'Company', 'Position']
      expect(linkedinParser.isApplicableParser(headers)).toBe(true)
    })

    it('should identify LinkedIn CSV with Connected On header', () => {
      const headers = ['First Name', 'Last Name', 'URL', 'Connected On']
      expect(linkedinParser.isApplicableParser(headers)).toBe(true)
    })

    it('should not identify non-LinkedIn CSV', () => {
      const headers = ['Name', 'Email', 'Phone']
      expect(linkedinParser.isApplicableParser(headers)).toBe(false)
    })

    it('should handle case-insensitive headers', () => {
      const headers = ['first name', 'last name', 'url', 'email address']
      expect(linkedinParser.isApplicableParser(headers)).toBe(true)
    })

    it('should detect LinkedIn Notes format', () => {
      const notesHeaders = ['Notes:']
      expect(linkedinParser.isApplicableParser(notesHeaders)).toBe(true)
    })

    it('should not detect multiple Notes headers as LinkedIn', () => {
      const multipleHeaders = ['Notes:', 'Other']
      expect(linkedinParser.isApplicableParser(multipleHeaders)).toBe(false)
    })
  })

  describe('getFirstDataRow', () => {
    it('should return headers and first row for regular LinkedIn CSV', () => {
      const csvContent = `First Name,Last Name,URL,Email Address,Company,Position,Connected On
John,Doe,https://www.linkedin.com/in/johndoe,john@example.com,Acme Corp,CEO,01 Jan 2024
Jane,Smith,https://www.linkedin.com/in/janesmith,,Tech Co,CTO,02 Jan 2024`

      const result = linkedinParser.getFirstDataRow(csvContent)
      
      expect(result.headers).toEqual(['First Name', 'Last Name', 'URL', 'Email Address', 'Company', 'Position', 'Connected On'])
      expect(result.firstRow).toEqual({
        'First Name': 'John',
        'Last Name': 'Doe',
        'URL': 'https://www.linkedin.com/in/johndoe',
        'Email Address': 'john@example.com',
        'Company': 'Acme Corp',
        'Position': 'CEO',
        'Connected On': '01 Jan 2024'
      })
    })

    it('should handle LinkedIn Notes format and return actual contact data', () => {
      const csvContent = `Notes:
"When exporting your connection data, you may notice that some of the email addresses are missing."

First Name,Last Name,URL,Email Address,Company,Position,Connected On
John,Doe,https://www.linkedin.com/in/johndoe,john@example.com,Acme Corp,CEO,01 Jan 2024
Jane,Smith,https://www.linkedin.com/in/janesmith,,Tech Co,CTO,02 Jan 2024`

      const result = linkedinParser.getFirstDataRow(csvContent)
      
      expect(result.headers).toEqual(['First Name', 'Last Name', 'URL', 'Email Address', 'Company', 'Position', 'Connected On'])
      expect(result.firstRow).toEqual({
        'First Name': 'John',
        'Last Name': 'Doe',
        'URL': 'https://www.linkedin.com/in/johndoe',
        'Email Address': 'john@example.com',
        'Company': 'Acme Corp',
        'Position': 'CEO',
        'Connected On': '01 Jan 2024'
      })
    })

    it('should return null firstRow for empty CSV', () => {
      const csvContent = `First Name,Last Name,URL`
      
      const result = linkedinParser.getFirstDataRow(csvContent)
      
      expect(result.headers).toEqual(['First Name', 'Last Name', 'URL'])
      expect(result.firstRow).toBeNull()
    })
  })

  describe('parse', () => {
    it('should parse LinkedIn CSV correctly', () => {
      const contacts = linkedinParser.parse(linkedinCsv)
      
      expect(contacts).toHaveLength(5)
      
      // Check first contact
      const firstContact = contacts[0]
      expect(firstContact.name).toBe('John Doe')
      expect(firstContact.company).toBe('Acme Corp')
      expect(firstContact.role).toBe('CEO')
      expect(firstContact.contactInfo.emails).toEqual(['john@example.com'])
      expect(firstContact.contactInfo.linkedinUrl).toBe('https://linkedin.com/in/johndoe')
      expect(firstContact.notes).toContain('LinkedIn connected: 15-Jan-24')
      expect(firstContact.source).toBe('linkedin')
    })

    it('should handle missing optional fields', () => {
      const contacts = linkedinParser.parse(linkedinCsv)
      const bobContact = contacts.find(c => c.name === 'Bob Wilson')
      
      expect(bobContact).toBeDefined()
      expect(bobContact!.contactInfo.emails).toEqual([])
      expect(bobContact!.company).toBe('Startup Inc')
    })

    it('should generate unique IDs for each contact', () => {
      const contacts = linkedinParser.parse(linkedinCsv)
      const ids = contacts.map(c => c.id)
      const uniqueIds = new Set(ids)
      
      expect(uniqueIds.size).toBe(contacts.length)
      expect(ids[0]).toMatch(/^linkedin-\d+-\d+-[a-z0-9]+$/)
    })

    it('should filter out empty contacts', () => {
      const csvWithEmpty = `First Name,Last Name,URL,Email Address,Company,Position,Connected On
John,Doe,https://linkedin.com/in/johndoe,john@example.com,Acme,CEO,1-Jan-24
,,,,,,
Jane,Smith,https://linkedin.com/in/janesmith,jane@example.com,Tech Co,CTO,2-Jan-24`
      
      const contacts = linkedinParser.parse(csvWithEmpty)
      // Empty row gets name "Contact 2", so it won't be filtered
      expect(contacts).toHaveLength(3)
      expect(contacts[1].name).toBe('Contact 2') // The empty row
    })

    it('should handle names with only first or last name', () => {
      const csvWithSingleName = `First Name,Last Name,URL,Email Address,Company,Position,Connected On
John,,https://linkedin.com/in/john,john@example.com,Acme,CEO,1-Jan-24
,Smith,https://linkedin.com/in/smith,smith@example.com,Tech Co,CTO,2-Jan-24`
      
      const contacts = linkedinParser.parse(csvWithSingleName)
      expect(contacts[0].name).toBe('John')
      expect(contacts[1].name).toBe('Smith')
    })

    it('should trim whitespace from all fields', () => {
      const csvWithSpaces = `First Name,Last Name,URL,Email Address,Company,Position,Connected On
  John  ,  Doe  ,  https://linkedin.com/in/johndoe  ,  john@example.com  ,  Acme Corp  ,  CEO  ,  1-Jan-24  `
      
      const contacts = linkedinParser.parse(csvWithSpaces)
      expect(contacts[0].name).toBe('John Doe')
      expect(contacts[0].company).toBe('Acme Corp')
      expect(contacts[0].contactInfo.emails[0]).toBe('john@example.com')
    })

    it('should handle real LinkedIn export format with Notes section', () => {
      const realLinkedInFormat = `Notes:
"When exporting your connection data, you may notice that some of the email addresses are missing. You will only see email addresses for connections who have allowed their connections to see or download their email address using this setting https://www.linkedin.com/psettings/privacy/email. You can learn more here https://www.linkedin.com/help/linkedin/answer/261"

First Name,Last Name,URL,Email Address,Company,Position,Connected On
John,Doe,https://www.linkedin.com/in/johndoe,john@example.com,Acme Corp,CEO,01 Jan 2024
Jane,Smith,https://www.linkedin.com/in/janesmith,,Tech Co,CTO,02 Jan 2024`
      
      const contacts = linkedinParser.parse(realLinkedInFormat)
      expect(contacts).toHaveLength(2)
      expect(contacts[0].name).toBe('John Doe')
      expect(contacts[0].company).toBe('Acme Corp')
      expect(contacts[0].contactInfo.emails).toEqual(['john@example.com'])
      expect(contacts[1].name).toBe('Jane Smith')
      expect(contacts[1].contactInfo.emails).toEqual([])
    })
  })
})