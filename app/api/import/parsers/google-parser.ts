import Papa from 'papaparse'
import type { Contact } from "@/types/contact"

export function isApplicableParser(headers: string[]): boolean {
  // Google has distinctive numbered patterns that LinkedIn doesn't have
  
  // Core Google patterns (numbered format is unique to Google)
  const hasEmailValuePattern = headers.some(h => h.match(/^E-mail \d+ - Value$/))
  const hasPhoneValuePattern = headers.some(h => h.match(/^Phone \d+ - Value$/))
  const hasOrganizationPattern = headers.some(h => h.match(/^Organization \d+ - Name$/))
  const hasAddressPattern = headers.some(h => h.match(/^Address \d+ - Formatted$/))
  
  // Google Takeout specific headers (very distinctive)
  const googleTakeoutHeaders = [
    'Given Name', 'Family Name', 'Additional Name', 'Name Prefix', 'Name Suffix',
    'Phonetic First Name', 'Phonetic Last Name', 'File As', 'Labels',
    'Organization Department', 'Birthday', 'Photo'
  ]
  const takeoutHeaderCount = googleTakeoutHeaders.filter(h => headers.includes(h)).length
  
  // Anti-patterns: LinkedIn-specific headers that Google doesn't have
  const hasLinkedInPatterns = headers.includes('Email Address') || 
                              headers.includes('Connected On') || 
                              headers.includes('Position')
  
  // Must have at least one Google pattern AND not be LinkedIn
  const hasGooglePatterns = hasEmailValuePattern || hasPhoneValuePattern || 
                           hasOrganizationPattern || hasAddressPattern || 
                           takeoutHeaderCount >= 2
  
  return hasGooglePatterns && !hasLinkedInPatterns
}

export function getFirstDataRow(csvContent: string): { headers: string[], firstRow: Record<string, string> | null } {
  const parseResult = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    preview: 2, // Just headers + first row
    transform: (value: string) => value.trim()
  })

  return {
    headers: parseResult.meta.fields || [],
    firstRow: parseResult.data[0] || null
  }
}

export function parse(csvContent: string): Contact[] {
  const parseResult = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transform: (value: string) => value.trim()
  })

  if (parseResult.errors.length > 0) {
    console.warn('CSV parsing warnings:', parseResult.errors)
  }

  return parseResult.data.map((row, index) => {
      // Extract emails - handle multiple possible formats
      const emails: string[] = []
      
      // Try numbered Google format first
      for (let i = 1; i <= 5; i++) {
        if (row[`E-mail ${i} - Value`]) emails.push(row[`E-mail ${i} - Value`])
      }
      
      // Also check for other common email field names
      const emailFields = [
        'Email Address', 'Email', 'Primary Email', 'E-mail Address', 
        'E-mail 1 - Value', 'E-mail Address - Value'
      ]
      for (const field of emailFields) {
        if (row[field] && !emails.includes(row[field])) {
          emails.push(row[field])
        }
      }

      // Extract phones - handle multiple possible formats  
      const phones: string[] = []
      
      // Try numbered Google format first
      for (let i = 1; i <= 5; i++) {
        if (row[`Phone ${i} - Value`]) phones.push(row[`Phone ${i} - Value`])
      }
      
      // Also check for other common phone field names
      const phoneFields = [
        'Phone Number', 'Phone', 'Primary Phone', 'Mobile Phone',
        'Phone 1 - Value', 'Phone Number - Value'
      ]
      for (const field of phoneFields) {
        if (row[field] && !phones.includes(row[field])) {
          phones.push(row[field])
        }
      }

      // Extract company and role
      const company = row["Organization Name"] || row["Organization 1 - Name"] || undefined
      const role = row["Organization Title"] || row["Organization 1 - Title"] || undefined
      
      // Build full name from parts or use Name field directly
      const nameParts = [
        row["Name Prefix"],
        row["First Name"] || row["Given Name"],
        row["Middle Name"] || row["Additional Name"],
        row["Last Name"] || row["Family Name"], 
        row["Name Suffix"]
      ].filter(Boolean).join(' ').trim()
      
      // Only use fallback name if we have some contact info (email, phone, etc.)
      const hasContactInfo = emails.length > 0 || phones.length > 0 || company
      const fallbackName = hasContactInfo ? `Contact ${index + 1}` : ''
      const fullName = row["Name"] || nameParts || row["Nickname"] || fallbackName
      const department = row["Organization Department"] || row["Organization 1 - Department"]
      
      // Extract location from address
      const location = row["Address 1 - City"] || row["Address 1 - Formatted"] || undefined

      // Build notes from various fields
      const noteParts: string[] = []
      
      if (row["Notes"]) noteParts.push(row["Notes"])
      if (row["Birthday"]) noteParts.push(`Birthday: ${row["Birthday"]}`)
      if (department) noteParts.push(`Department: ${department}`)
      if (row["Labels"]) noteParts.push(`Labels: ${row["Labels"]}`)
      if (row["Relation 1 - Value"]) {
        const relationLabel = row["Relation 1 - Label"] || "Relation"
        noteParts.push(`${relationLabel}: ${row["Relation 1 - Value"]}`)
      }
      
      // Add full address if available
      if (row["Address 1 - Street"] || row["Address 1 - Formatted"]) {
        const addressParts = [
          row["Address 1 - Street"],
          row["Address 1 - City"],
          row["Address 1 - Region"],
          row["Address 1 - Postal Code"],
          row["Address 1 - Country"]
        ].filter(Boolean).join(', ')
        
        if (addressParts) {
          const addressLabel = row["Address 1 - Label"] || "Address"
          noteParts.push(`${addressLabel}: ${addressParts}`)
        }
      }

      const notes = noteParts.join('\n')

      // Extract other URLs
      const otherUrls: { platform: string; url: string }[] = []
      if (row["Website 1 - Value"]) {
        const label = row["Website 1 - Label"] || "Website"
        otherUrls.push({ platform: label, url: row["Website 1 - Value"] })
      }

      const contact: Contact = {
        id: `google-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 11)}`,
        name: fullName,
        company,
        role,
        location,
        contactInfo: {
          emails,
          phones,
          linkedinUrl: undefined,
          otherUrls
        },
        notes,
        source: "google",
        createdAt: new Date(),
        updatedAt: new Date()
      }

      return contact
  }).filter(contact => contact.name.trim() !== '')
}