import { Contact } from '@/types/contact'

export interface DuplicateMatch {
  existing: Contact
  incoming: Partial<Contact>
  matchType: 'name' | 'email' | 'phone' | 'linkedin'
  matchValue: string
}

export interface MergeDecision {
  action: 'merge' | 'skip' | 'keep-both'
  mergedContact?: Contact
}

function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ')
}

function normalizePhone(phone: string): string {
  // Remove all non-numeric characters
  return phone.replace(/\D/g, '')
}

export function findDuplicates(
  existingContacts: Contact[],
  incomingContact: Partial<Contact>
): DuplicateMatch[] {
  const duplicates: DuplicateMatch[] = []
  
  for (const existing of existingContacts) {
    // Check name match
    if (incomingContact.name && normalizeString(existing.name) === normalizeString(incomingContact.name)) {
      duplicates.push({
        existing,
        incoming: incomingContact,
        matchType: 'name',
        matchValue: incomingContact.name
      })
      continue
    }
    
    // Check email matches
    if (incomingContact.contactInfo?.emails) {
      for (const email of incomingContact.contactInfo.emails) {
        if (existing.contactInfo.emails.some(e => e.toLowerCase() === email.toLowerCase())) {
          duplicates.push({
            existing,
            incoming: incomingContact,
            matchType: 'email',
            matchValue: email
          })
          break
        }
      }
    }
    
    // Check phone matches
    if (incomingContact.contactInfo?.phones) {
      for (const phone of incomingContact.contactInfo.phones) {
        const normalizedPhone = normalizePhone(phone)
        if (existing.contactInfo.phones.some(p => normalizePhone(p) === normalizedPhone)) {
          duplicates.push({
            existing,
            incoming: incomingContact,
            matchType: 'phone',
            matchValue: phone
          })
          break
        }
      }
    }
    
    // Check LinkedIn matches
    if (incomingContact.contactInfo?.linkedinUrls) {
      for (const url of incomingContact.contactInfo.linkedinUrls) {
        if (existing.contactInfo.linkedinUrls.some(u => u === url)) {
          duplicates.push({
            existing,
            incoming: incomingContact,
            matchType: 'linkedin',
            matchValue: url
          })
          break
        }
      }
    }
  }
  
  // Remove duplicate matches (same contact matched multiple ways)
  const uniqueDuplicates = duplicates.filter((match, index, self) =>
    index === self.findIndex(m => m.existing.id === match.existing.id)
  )
  
  return uniqueDuplicates
}

function mergeContactNotes(
  existingNotes: string,
  incomingNotes: string
): string {
  // If one is empty, return the other
  if (!existingNotes || !existingNotes.trim()) return incomingNotes || ''
  if (!incomingNotes || !incomingNotes.trim()) return existingNotes || ''
  
  // Parse key-value pairs from notes
  const parseNotes = (notes: string): Map<string, string> => {
    const parsed = new Map<string, string>()
    const lines = notes.split(/[;\n]/).map(line => line.trim()).filter(Boolean)
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim().toLowerCase()
        const value = line.substring(colonIndex + 1).trim()
        
        // If key already exists, keep the longer/more detailed value
        const existing = parsed.get(key)
        if (!existing || value.length > existing.length) {
          parsed.set(key, value)
        }
      } else {
        // Non key-value content
        parsed.set(`_note_${parsed.size}`, line)
      }
    }
    
    return parsed
  }
  
  // Parse both notes
  const existingParsed = parseNotes(existingNotes)
  const incomingParsed = parseNotes(incomingNotes)
  
  // Merge maps, preferring longer values
  const merged = new Map<string, string>()
  
  // Add all from existing
  for (const [key, value] of existingParsed) {
    merged.set(key, value)
  }
  
  // Add/update from incoming
  for (const [key, value] of incomingParsed) {
    const existing = merged.get(key)
    if (!existing || value.length > existing.length) {
      merged.set(key, value)
    }
  }
  
  // Reconstruct notes
  const result: string[] = []
  const standardKeys = ['company', 'title', 'position', 'location', 'email', 'phone']
  
  // Add standard fields first
  for (const key of standardKeys) {
    if (merged.has(key)) {
      const value = merged.get(key)!
      result.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
      merged.delete(key)
    }
  }
  
  // Add other key-value pairs
  for (const [key, value] of merged) {
    if (!key.startsWith('_note_')) {
      result.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
    }
  }
  
  // Add non-key-value notes at the end
  const notes: string[] = []
  for (const [key, value] of merged) {
    if (key.startsWith('_note_')) {
      notes.push(value)
    }
  }
  
  if (notes.length > 0) {
    if (result.length > 0) result.push('') // Empty line
    result.push(...notes)
  }
  
  return result.join('\n')
}

export function mergeContacts(
  existing: Contact,
  incoming: Partial<Contact>
): Contact {
  // Merge notes intelligently
  const mergedNotes = mergeContactNotes(
    existing.notes || '',
    incoming.notes || ''
  )
  
  const merged: Contact = {
    ...existing,
    // Keep existing name unless incoming has a longer/better one
    name: (incoming.name && incoming.name.length > existing.name.length) 
      ? incoming.name 
      : existing.name,
    contactInfo: {
      // Merge and deduplicate arrays
      phones: Array.from(new Set([
        ...existing.contactInfo.phones,
        ...(incoming.contactInfo?.phones || [])
      ])),
      emails: Array.from(new Set([
        ...existing.contactInfo.emails,
        ...(incoming.contactInfo?.emails || [])
      ])),
      linkedinUrls: Array.from(new Set([
        ...existing.contactInfo.linkedinUrls,
        ...(incoming.contactInfo?.linkedinUrls || [])
      ]))
    },
    // Use AI-merged notes
    notes: mergedNotes,
    // Update timestamp
    updatedAt: new Date()
  }
  
  return merged
}