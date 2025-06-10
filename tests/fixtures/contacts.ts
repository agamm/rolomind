import type { Contact } from '@/types/contact'

export const sampleContacts: Contact[] = [
  {
    id: 'test-1',
    name: 'John Doe',
    company: 'Tech Startup',
    role: 'CEO',
    location: 'San Francisco, CA',
    contactInfo: {
      emails: ['john@techstartup.com'],
      phones: ['+1-415-555-0123'],
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      otherUrls: []
    },
    notes: 'Met at startup conference 2024',
    source: 'linkedin',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'test-2',
    name: 'Jane Smith',
    company: 'AI Company',
    role: 'CEO',
    location: 'New York, NY',
    contactInfo: {
      emails: ['jane@aicompany.com', 'jane.smith@gmail.com'],
      phones: ['+1-212-555-0456'],
      linkedinUrl: 'https://linkedin.com/in/janesmith',
      otherUrls: [
        { platform: 'twitter', url: 'https://twitter.com/janesmith' }
      ]
    },
    notes: 'AI/ML expert, keynote speaker',
    source: 'manual',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20')
  },
  {
    id: 'test-3',
    name: 'Bob Wilson',
    company: 'Stealth',
    role: 'Co-founder & CEO',
    location: 'Austin, TX',
    contactInfo: {
      emails: ['bob@stealth.io'],
      phones: [],
      linkedinUrl: 'https://linkedin.com/in/bobwilson',
      otherUrls: []
    },
    notes: 'Working on something in fintech',
    source: 'linkedin',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10')
  },
  {
    id: 'test-tmp',
    name: 'tmp',
    company: undefined,
    role: undefined,
    location: undefined,
    contactInfo: {
      emails: ['temp@email.com'],
      phones: [],
      linkedinUrl: undefined,
      otherUrls: []
    },
    notes: 'Non-descriptive contact',
    source: 'manual',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'test-contact-123',
    name: 'Contact 123',
    company: 'Unknown Company',
    role: undefined,
    location: undefined,
    contactInfo: {
      emails: [],
      phones: ['555-0123'],
      linkedinUrl: undefined,
      otherUrls: []
    },
    notes: 'Generic placeholder name',
    source: 'manual',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: 'test-old-1',
    name: 'Sarah Johnson',
    company: 'Legacy Corp',
    role: 'Director',
    location: 'Boston, MA',
    contactInfo: {
      emails: ['sarah@legacycorp.com'],
      phones: [],
      linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
      otherUrls: []
    },
    notes: 'LinkedIn connected: 15-Dec-23',
    source: 'linkedin',
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2023-12-15')
  },
  {
    id: 'test-old-2',
    name: 'Mike Chen',
    company: 'Old School Inc',
    role: 'VP Engineering',
    location: 'Seattle, WA',
    contactInfo: {
      emails: ['mike@oldschool.com'],
      phones: ['+1-206-555-0199'],
      linkedinUrl: 'https://linkedin.com/in/mikechen',
      otherUrls: []
    },
    notes: 'LinkedIn connected: 20-Jan-23',
    source: 'linkedin',
    createdAt: new Date('2023-01-20'),
    updatedAt: new Date('2023-01-20')
  }
]

// Helper to get contacts by IDs
export function getContactsByIds(ids: string[]): Contact[] {
  return sampleContacts.filter(contact => ids.includes(contact.id))
}

// Helper to create a new contact with defaults
export function createTestContact(overrides: Partial<Contact> = {}): Contact {
  const id = overrides.id || `test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  return {
    id,
    name: 'Test Contact',
    company: 'Test Company',
    role: 'Test Role',
    location: 'Test Location',
    contactInfo: {
      emails: [],
      phones: [],
      linkedinUrl: undefined,
      otherUrls: []
    },
    notes: '',
    source: 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}