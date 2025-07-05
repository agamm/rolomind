import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as googleParser from '@/app/api/import/parsers/google-parser'

describe('Google Parser', () => {
  const googleCsv = readFileSync(
    join(__dirname, '../../fixtures/google.csv'),
    'utf-8'
  )

  describe('isApplicableParser', () => {
    it('should identify Google Contacts CSV by headers', () => {
      // Old format
      const headers1 = ['Name', 'Given Name', 'Family Name', 'E-mail 1 - Value', 'Phone 1 - Value']
      expect(googleParser.isApplicableParser(headers1)).toBe(true)
      
      // New format (actual production export)
      const headers2 = ['First Name', 'Middle Name', 'Last Name', 'E-mail 1 - Value', 'Phone 1 - Value', 'Organization Name']
      expect(googleParser.isApplicableParser(headers2)).toBe(true)
      
      // Real Google Takeout format (full header set)
      const takeoutHeaders = [
        'First Name', 'Middle Name', 'Last Name', 'Phonetic First Name',
        'Phonetic Middle Name', 'Phonetic Last Name', 'Name Prefix', 'Name Suffix',
        'Nickname', 'File As', 'Organization Name', 'Organization Title',
        'Organization Department', 'Birthday', 'Notes', 'Photo', 'Labels',
        'E-mail 1 - Label', 'E-mail 1 - Value', 'E-mail 2 - Label', 'E-mail 2 - Value'
      ]
      expect(googleParser.isApplicableParser(takeoutHeaders)).toBe(true)
    })

    it('should identify with Phone header pattern', () => {
      const headers = ['First Name', 'Last Name', 'Phone 1 - Value', 'E-mail 1 - Value']
      expect(googleParser.isApplicableParser(headers)).toBe(true)
    })

    it('should identify with Organization header pattern', () => {
      const headers = ['First Name', 'Last Name', 'Organization 1 - Name', 'E-mail 1 - Value']
      expect(googleParser.isApplicableParser(headers)).toBe(true)
    })

    it('should not identify non-Google CSV', () => {
      const headers = ['First Name', 'Last Name', 'Email']
      expect(googleParser.isApplicableParser(headers)).toBe(false)
    })
  })

  describe('getFirstDataRow', () => {
    it('should return headers and first row for Google CSV', () => {
      const csvContent = `First Name,Last Name,E-mail 1 - Value,Phone 1 - Value,Organization 1 - Name
John,Doe,john@example.com,555-1234,Acme Corp
Jane,Smith,jane@example.com,555-5678,Tech Co`

      const result = googleParser.getFirstDataRow(csvContent)
      
      expect(result.headers).toEqual(['First Name', 'Last Name', 'E-mail 1 - Value', 'Phone 1 - Value', 'Organization 1 - Name'])
      expect(result.firstRow).toEqual({
        'First Name': 'John',
        'Last Name': 'Doe',
        'E-mail 1 - Value': 'john@example.com',
        'Phone 1 - Value': '555-1234',
        'Organization 1 - Name': 'Acme Corp'
      })
    })

    it('should return null firstRow for empty CSV', () => {
      const csvContent = `First Name,Last Name,E-mail 1 - Value`
      
      const result = googleParser.getFirstDataRow(csvContent)
      
      expect(result.headers).toEqual(['First Name', 'Last Name', 'E-mail 1 - Value'])
      expect(result.firstRow).toBeNull()
    })
  })

  describe('parse', () => {
    it('should parse Google CSV correctly', () => {
      const contacts = googleParser.parse(googleCsv)
      
      expect(contacts).toHaveLength(4)
      
      // Check first contact
      const firstContact = contacts[0]
      expect(firstContact.name).toBe('John Doe')
      expect(firstContact.company).toBe('Acme Corp')
      expect(firstContact.role).toBe('CEO')
      expect(firstContact.location).toBe('123 Main St, San Francisco, CA')
      expect(firstContact.contactInfo.emails).toEqual(['john@example.com'])
      expect(firstContact.contactInfo.phones).toEqual(['+1-555-0123'])
      expect(firstContact.source).toBe('google')
    })

    it('should handle multiple email addresses', () => {
      const csvWithMultipleEmails = `Name,E-mail 1 - Value,E-mail 2 - Value,E-mail 3 - Value
John Doe,john@work.com,john@personal.com,john@other.com`
      
      const contacts = googleParser.parse(csvWithMultipleEmails)
      expect(contacts[0].contactInfo.emails).toEqual([
        'john@work.com',
        'john@personal.com',
        'john@other.com'
      ])
    })

    it('should handle multiple phone numbers', () => {
      const csvWithMultiplePhones = `Name,Phone 1 - Value,Phone 2 - Value,Phone 3 - Value
John Doe,555-0123,555-0124,555-0125`
      
      const contacts = googleParser.parse(csvWithMultiplePhones)
      expect(contacts[0].contactInfo.phones).toEqual([
        '555-0123',
        '555-0124',
        '555-0125'
      ])
    })

    it('should extract website URLs', () => {
      const contacts = googleParser.parse(googleCsv)
      const johnContact = contacts[0]
      
      expect(johnContact.contactInfo.otherUrls).toContainEqual({
        platform: 'Website', // Parser uses the label from CSV
        url: 'https://acme.com'
      })
    })

    it('should handle missing optional fields', () => {
      const contacts = googleParser.parse(googleCsv)
      const bobContact = contacts.find(c => c.name === 'Bob Wilson')
      
      expect(bobContact).toBeDefined()
      expect(bobContact!.contactInfo.phones).toEqual([])
      expect(bobContact!.location).toBeUndefined()
    })

    it('should generate unique IDs', () => {
      const contacts = googleParser.parse(googleCsv)
      const ids = contacts.map(c => c.id)
      const uniqueIds = new Set(ids)
      
      expect(uniqueIds.size).toBe(contacts.length)
      expect(ids[0]).toMatch(/^google-\d+-\d+-[a-z0-9]+$/)
    })

    it('should use Name field when Given/Family names are missing', () => {
      const csvWithOnlyName = `Name,E-mail 1 - Value
John Doe,john@example.com
Jane Smith,jane@example.com`
      
      const contacts = googleParser.parse(csvWithOnlyName)
      expect(contacts[0].name).toBe('John Doe')
      expect(contacts[1].name).toBe('Jane Smith')
    })

    it('should parse production Google Contacts format with First/Last Name', () => {
      const productionCsv = `First Name,Middle Name,Last Name,Organization Name,Organization Title,Phone 1 - Label,Phone 1 - Value,E-mail 1 - Value
Alex,,Smith,,,Mobile,+1 555-555-0001,
David,,Johnson,,,Mobile,+1 555-555-0002,
John,Michael,Doe,Acme Corp,CEO,Work,555-0123,john@acme.com`
      
      const contacts = googleParser.parse(productionCsv)
      expect(contacts).toHaveLength(3)
      
      // Check first contact
      expect(contacts[0].name).toBe('Alex Smith')
      expect(contacts[0].contactInfo.phones).toEqual(['+1 555-555-0001'])
      
      // Check second contact
      expect(contacts[1].name).toBe('David Johnson')
      expect(contacts[1].contactInfo.phones).toEqual(['+1 555-555-0002'])
      
      // Check third contact with all fields
      expect(contacts[2].name).toBe('John Michael Doe')
      expect(contacts[2].company).toBe('Acme Corp')
      expect(contacts[2].role).toBe('CEO')
      expect(contacts[2].contactInfo.emails).toEqual(['john@acme.com'])
    })

    it('should detect and parse real Google Takeout CSV format', () => {
      // This is the exact format from Google Takeout exports
      const takeoutHeaders = [
        'First Name', 'Middle Name', 'Last Name', 'Phonetic First Name', 
        'Phonetic Middle Name', 'Phonetic Last Name', 'Name Prefix', 'Name Suffix', 
        'Nickname', 'File As', 'Organization Name', 'Organization Title', 
        'Organization Department', 'Birthday', 'Notes', 'Photo', 'Labels',
        'E-mail 1 - Label', 'E-mail 1 - Value', 'E-mail 2 - Label', 'E-mail 2 - Value'
      ]
      
      expect(googleParser.isApplicableParser(takeoutHeaders)).toBe(true)
      
      const takeoutCsv = `${takeoutHeaders.join(',')}
,,,,,,,,,,,,,,,,* Other Contacts,* ,2143990445@vzwpix.com,,
Aaron,,Tijerina,,,,,,,,,,,,,,* Other Contacts,* ,atijerina@texasbank.com,,
Agam,,More,,,,,,,,,,,,,,* Other Contacts,* ,agam@agam.me,,`
      
      const contacts = googleParser.parse(takeoutCsv)
      expect(contacts).toHaveLength(3) // All rows have contact info (emails)
      
      // Check first contact (no name but has email, gets fallback name)
      expect(contacts[0].name).toBe('Contact 1')
      expect(contacts[0].contactInfo.emails).toEqual(['2143990445@vzwpix.com'])
      expect(contacts[0].source).toBe('google')
      
      // Check second contact
      expect(contacts[1].name).toBe('Aaron Tijerina')
      expect(contacts[1].contactInfo.emails).toEqual(['atijerina@texasbank.com'])
      expect(contacts[1].source).toBe('google')
      
      // Check third contact
      expect(contacts[2].name).toBe('Agam More')
      expect(contacts[2].contactInfo.emails).toEqual(['agam@agam.me'])
    })
  })
})