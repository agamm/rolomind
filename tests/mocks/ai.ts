import { vi } from 'vitest'

export const mockGenerateObject = vi.fn().mockImplementation(({ schema, prompt }) => {
  // For query-contacts - matching contacts
  if (prompt.includes('Find all contacts that match the query')) {
    const query = prompt.match(/Query: "([^"]+)"/)?.[1] || ''
    
    // Mock different responses based on query
    if (query.toLowerCase().includes('ceos in usa')) {
      return {
        object: [
          { id: 'test-1', reason: 'CEO at Tech Startup in San Francisco, CA' },
          { id: 'test-2', reason: 'CEO at AI Company based in New York, NY' },
          { id: 'test-3', reason: 'Co-founder & CEO at Stealth startup in Austin, TX' }
        ]
      }
    }
    
    if (query.toLowerCase().includes('non descriptive')) {
      return {
        object: [
          { id: 'test-tmp', reason: 'Contact name is "tmp" - non-descriptive placeholder' },
          { id: 'test-contact-123', reason: 'Contact name is "Contact 123" - generic placeholder' }
        ]
      }
    }
    
    if (query.toLowerCase().includes('before 2024')) {
      return {
        object: [
          { id: 'test-old-1', reason: 'LinkedIn connected: 15-Dec-23 (before 2024)' },
          { id: 'test-old-2', reason: 'LinkedIn connected: 20-Jan-23 (before 2024)' }
        ]
      }
    }
    
    // Default empty result
    return { object: [] }
  }
  
  // For generate-summary
  if (prompt.includes('Analyze these')) {
    const contactCount = prompt.match(/Analyze these (\d+) contacts/)?.[1] || '0'
    return {
      object: {
        summary: `Found ${contactCount} contacts matching the search criteria. Most are based in major tech hubs.`,
        keyInsights: [
          'Majority are in senior leadership positions',
          'Strong representation from AI/ML companies',
          'Geographic concentration in tech hubs',
          'Mix of established companies and startups'
        ].slice(0, Math.min(4, parseInt(contactCount))),
        totalMatches: parseInt(contactCount)
      }
    }
  }
  
  // For custom parser (LLM normalizer)
  if (prompt.includes('normalize') || prompt.includes('parse this CSV')) {
    return {
      object: {
        contacts: [
          {
            name: 'John Doe',
            company: 'Acme Corp',
            role: 'CEO',
            location: 'San Francisco, CA',
            emails: ['john@acme.com'],
            phones: ['+1-415-555-0123'],
            linkedinUrl: '',
            notes: 'Imported from custom CSV'
          },
          {
            name: 'Jane Smith',
            company: 'Tech Co',
            role: 'CTO',
            location: 'New York, NY',
            emails: ['jane@techco.com'],
            phones: [],
            linkedinUrl: 'https://linkedin.com/in/janesmith',
            notes: 'Technology leader'
          }
        ]
      }
    }
  }
  
  // Default response
  return { object: null }
})

// Mock the ai module
vi.mock('ai', () => ({
  generateObject: mockGenerateObject,
  APICallError: {
    isInstance: vi.fn().mockReturnValue(false)
  }
}))