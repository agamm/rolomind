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
  const parseNotes = (notes: string): { keyValues: Map<string, string>, freeText: Set<string> } => {
    const keyValues = new Map<string, string>()
    const freeText = new Set<string>()
    const lines = notes.split(/[;\n]/).map(line => line.trim()).filter(Boolean)
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim().toLowerCase()
        const value = line.substring(colonIndex + 1).trim()
        
        // If key already exists, keep the longer/more detailed value
        const existing = keyValues.get(key)
        if (!existing || value.length > existing.length) {
          keyValues.set(key, value)
        }
      } else {
        // Non key-value content - use Set to automatically deduplicate
        freeText.add(line)
      }
    }
    
    return { keyValues, freeText }
  }
  
  // Parse both notes
  const existingParsed = parseNotes(existingNotes)
  const incomingParsed = parseNotes(incomingNotes)
  
  // Merge key-value pairs, preferring longer values
  const mergedKeyValues = new Map<string, string>()
  
  // Add all from existing
  for (const [key, value] of existingParsed.keyValues) {
    mergedKeyValues.set(key, value)
  }
  
  // Add/update from incoming
  for (const [key, value] of incomingParsed.keyValues) {
    const existing = mergedKeyValues.get(key)
    if (!existing || value.length > existing.length) {
      mergedKeyValues.set(key, value)
    }
  }
  
  // Merge free text (Set automatically deduplicates)
  const mergedFreeText = new Set<string>()
  for (const text of existingParsed.freeText) {
    mergedFreeText.add(text)
  }
  for (const text of incomingParsed.freeText) {
    mergedFreeText.add(text)
  }
  
  // Reconstruct notes
  const result: string[] = []
  const standardKeys = ['company', 'title', 'position', 'location', 'email', 'phone']
  
  // Add standard fields first
  for (const key of standardKeys) {
    if (mergedKeyValues.has(key)) {
      const value = mergedKeyValues.get(key)!
      result.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
      mergedKeyValues.delete(key)
    }
  }
  
  // Add other key-value pairs
  for (const [key, value] of mergedKeyValues) {
    result.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
  }
  
  // Add non-key-value notes at the end
  if (mergedFreeText.size > 0) {
    if (result.length > 0) result.push('') // Empty line
    result.push(...Array.from(mergedFreeText))
  }
  
  return result.join('\n')
}

function cleanNotesFromDuplicateFields(
  notes: string, 
  contact: Partial<Contact>
): string {
  if (!notes) return ''
  
  // Split notes into lines
  const lines = notes.split('\n').map(line => line.trim()).filter(Boolean)
  const cleanedLines: string[] = []
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    let shouldKeep = true
    
    // Check if this line contains information that's already in structured fields
    if (contact.role && (lowerLine.includes('role:') || lowerLine.includes('position:') || lowerLine.includes('title:'))) {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const value = line.substring(colonIndex + 1).trim()
        // Remove if it's the same as the structured field
        if (value.toLowerCase() === contact.role.toLowerCase()) {
          shouldKeep = false
        }
      }
    }
    
    if (contact.company && (lowerLine.includes('company:') || lowerLine.includes('employer:'))) {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const value = line.substring(colonIndex + 1).trim()
        if (value.toLowerCase() === contact.company.toLowerCase()) {
          shouldKeep = false
        }
      }
    }
    
    if (contact.location && lowerLine.includes('location:')) {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const value = line.substring(colonIndex + 1).trim()
        if (value.toLowerCase() === contact.location.toLowerCase()) {
          shouldKeep = false
        }
      }
    }
    
    // Remove "Connected on" lines since we extract this separately
    if (lowerLine.includes('connected:') || lowerLine.includes('connected on')) {
      shouldKeep = false
    }
    
    if (shouldKeep) {
      cleanedLines.push(line)
    }
  }
  
  return cleanedLines.join('\n')
}

export function mergeContacts(
  existing: Contact,
  incoming: Partial<Contact>
): Contact {
  // Merge structured fields first
  const mergedStructuredFields = {
    company: incoming.company || existing.company,
    role: incoming.role || existing.role,
    location: incoming.location || existing.location,
  }
  
  // Merge notes intelligently
  const mergedNotes = mergeContactNotes(
    existing.notes || '',
    incoming.notes || ''
  )
  
  // Clean merged notes from duplicate field information
  const cleanedNotes = cleanNotesFromDuplicateFields(mergedNotes, mergedStructuredFields)
  
  const merged: Contact = {
    ...existing,
    // Keep existing name unless incoming has a longer/better one
    name: (incoming.name && incoming.name.length > existing.name.length) 
      ? incoming.name 
      : existing.name,
    // Use merged structured fields
    ...mergedStructuredFields,
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
    // Use cleaned notes
    notes: cleanedNotes,
    // Update timestamp
    updatedAt: new Date()
  }
  
  return merged
}