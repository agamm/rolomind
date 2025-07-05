import Papa from 'papaparse'
import type { Contact } from "@/types/contact"

export function isApplicableParser(headers: string[]): boolean {
  // Google Contacts CSV has very specific headers with numbered patterns
  const googlePatterns = [
    'E-mail \\d+ - Value',
    'Phone \\d+ - Value',
    'Organization \\d+ - Name',
    'Address \\d+ - Formatted',
    'Website \\d+ - Value',
    'Relation \\d+ - Value'
  ]
  
  // Also check for name fields (either old or new format)
  const hasNameFields = (
    headers.includes('First Name') && headers.includes('Last Name')
  ) || (
    headers.includes('Given Name') && headers.includes('Family Name')
  )
  
  // Count how many Google-specific patterns we match
  let matchCount = 0
  for (const pattern of googlePatterns) {
    const regex = new RegExp(pattern)
    if (headers.some(h => regex.test(h))) {
      matchCount++
    }
  }
  
  // If we have name fields and match at least 2 Google patterns, it's likely a Google CSV
  return hasNameFields && matchCount >= 2
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
      // Build full name from parts or use Name field directly
      const nameParts = [
        row["Name Prefix"],
        row["First Name"] || row["Given Name"],
        row["Middle Name"] || row["Additional Name"],
        row["Last Name"] || row["Family Name"], 
        row["Name Suffix"]
      ].filter(Boolean).join(' ').trim()
      
      const fullName = row["Name"] || nameParts || row["Nickname"] || `Contact ${index + 1}`

      // Extract emails
      const emails: string[] = []
      for (let i = 1; i <= 5; i++) {
        if (row[`E-mail ${i} - Value`]) emails.push(row[`E-mail ${i} - Value`])
      }

      // Extract phones
      const phones: string[] = []
      for (let i = 1; i <= 5; i++) {
        if (row[`Phone ${i} - Value`]) phones.push(row[`Phone ${i} - Value`])
      }

      // Extract company and role
      const company = row["Organization Name"] || row["Organization 1 - Name"] || undefined
      const role = row["Organization Title"] || row["Organization 1 - Title"] || undefined
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