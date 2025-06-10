import { describe, it, expect, beforeEach } from 'vitest'
import { sampleContacts } from '../../fixtures/contacts'
import { setMockContacts, resetDbMocks, mockGetAllContacts } from '../../mocks/db'

describe('Export API', () => {
  beforeEach(() => {
    resetDbMocks()
  })

  it('should export all contacts to CSV', async () => {
    setMockContacts(sampleContacts.slice(0, 3))
    
    const handler = await import('@/app/api/export/route')
    const response = await handler.GET()
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/csv')
    expect(response.headers.get('Content-Disposition')).toMatch(/attachment; filename="contacts_export_.*\.csv"/)
    
    const csvContent = await response.text()
    
    // Check CSV headers
    expect(csvContent).toContain('Name,Company,Role,Location,Emails,Phones,LinkedIn URL,Other URLs,Notes,Source,Created Date,Updated Date')
    
    // Check first contact data
    expect(csvContent).toContain('John Doe')
    expect(csvContent).toContain('Tech Startup')
    expect(csvContent).toContain('CEO')
    expect(csvContent).toContain('San Francisco, CA')
    expect(mockGetAllContacts).toHaveBeenCalledOnce()
  })

  it('should escape special characters correctly', async () => {
    const contactWithSpecialChars = {
      ...sampleContacts[0],
      name: 'John "Johnny" Doe',
      notes: 'Line 1\nLine 2, with comma',
      company: 'Company, Inc.'
    }
    
    setMockContacts([contactWithSpecialChars])
    
    const handler = await import('@/app/api/export/route')
    const response = await handler.GET()
    const csvContent = await response.text()
    
    // Check proper escaping
    expect(csvContent).toContain('"John ""Johnny"" Doe"')
    expect(csvContent).toContain('"Company, Inc."')
    expect(csvContent).toContain('"Line 1\nLine 2, with comma"')
  })

  it('should handle multiple emails and phones', async () => {
    const contactWithMultiple = {
      ...sampleContacts[1], // Jane Smith with multiple emails
      contactInfo: {
        ...sampleContacts[1].contactInfo,
        emails: ['jane@aicompany.com', 'jane.smith@gmail.com'],
        phones: ['+1-212-555-0456', '+1-917-555-0123']
      }
    }
    
    setMockContacts([contactWithMultiple])
    
    const handler = await import('@/app/api/export/route')
    const response = await handler.GET()
    const csvContent = await response.text()
    
    // Multiple values should be semicolon-separated
    expect(csvContent).toContain('jane@aicompany.com; jane.smith@gmail.com')
    expect(csvContent).toContain('+1-212-555-0456; +1-917-555-0123')
  })

  it('should handle other URLs formatting', async () => {
    const contactWithUrls = {
      ...sampleContacts[1],
      contactInfo: {
        ...sampleContacts[1].contactInfo,
        otherUrls: [
          { platform: 'twitter', url: 'https://twitter.com/jane' },
          { platform: 'github', url: 'https://github.com/jane' }
        ]
      }
    }
    
    setMockContacts([contactWithUrls])
    
    const handler = await import('@/app/api/export/route')
    const response = await handler.GET()
    const csvContent = await response.text()
    
    expect(csvContent).toContain('twitter: https://twitter.com/jane; github: https://github.com/jane')
  })

  it('should handle empty contact lists', async () => {
    setMockContacts([])
    
    const handler = await import('@/app/api/export/route')
    const response = await handler.GET()
    
    expect(response.status).toBe(200)
    const csvContent = await response.text()
    
    // Should have headers but no data rows
    const lines = csvContent.trim().split('\n')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('Name,Company,Role')
  })

  it('should format dates in ISO format', async () => {
    const contactWithDates = {
      ...sampleContacts[0],
      createdAt: new Date('2024-01-15T10:30:00Z'),
      updatedAt: new Date('2024-02-20T14:45:00Z')
    }
    
    setMockContacts([contactWithDates])
    
    const handler = await import('@/app/api/export/route')
    const response = await handler.GET()
    const csvContent = await response.text()
    
    expect(csvContent).toContain('2024-01-15T10:30:00.000Z')
    expect(csvContent).toContain('2024-02-20T14:45:00.000Z')
  })

  it('should handle undefined/null fields gracefully', async () => {
    const contactWithMissingFields = {
      ...sampleContacts[0],
      company: undefined,
      role: undefined,
      location: undefined,
      notes: '',
      contactInfo: {
        emails: [],
        phones: [],
        linkedinUrl: undefined,
        otherUrls: []
      }
    }
    
    setMockContacts([contactWithMissingFields])
    
    const handler = await import('@/app/api/export/route')
    const response = await handler.GET()
    const csvContent = await response.text()
    
    // Check that empty fields are represented as empty strings
    const lines = csvContent.trim().split('\n')
    const dataLine = lines[1]
    const fields = dataLine.split(',')
    
    // Name should be present, but company, role, location should be empty
    expect(fields[0]).toBe('John Doe')
    expect(fields[1]).toBe('') // Company
    expect(fields[2]).toBe('') // Role
    expect(fields[3]).toBe('') // Location
  })

  it('should handle database errors gracefully', async () => {
    mockGetAllContacts.mockRejectedValueOnce(new Error('Database error'))
    
    const handler = await import('@/app/api/export/route')
    const response = await handler.GET()
    
    expect(response.status).toBe(500)
    const data = await response.json()
    
    expect(data.error).toBe('Failed to export contacts')
  })

  it('should generate unique filename with current date', async () => {
    setMockContacts([])
    
    const handler = await import('@/app/api/export/route')
    const response = await handler.GET()
    
    const contentDisposition = response.headers.get('Content-Disposition')
    const today = new Date().toISOString().split('T')[0]
    
    expect(contentDisposition).toContain(`contacts_export_${today}.csv`)
  })
})