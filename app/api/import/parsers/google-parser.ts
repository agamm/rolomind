import Papa from 'papaparse'
import type { Contact } from "@/types/contact"

export function isApplicableParser(headers: string[]): boolean {
  // Google Contacts CSV has very specific headers
  const requiredHeaders = ['First Name', 'Last Name', 'Organization Name', 'E-mail 1 - Value']
  const googleSpecificHeaders = ['Phonetic First Name', 'Organization Title', 'E-mail 1 - Label', 'Phone 1 - Label']
  
  // Check if we have the core Google headers
  const hasRequiredHeaders = requiredHeaders.some(header => 
    headers.some(h => h.includes(header))
  )
  
  // Check if we have some Google-specific headers
  const hasGoogleHeaders = googleSpecificHeaders.some(header =>
    headers.some(h => h.includes(header))
  )
  
  return hasRequiredHeaders && hasGoogleHeaders
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
      // Build full name from parts
      const nameParts = [
        row["Name Prefix"],
        row["First Name"],
        row["Middle Name"],
        row["Last Name"],
        row["Name Suffix"]
      ].filter(Boolean).join(' ').trim()
      
      const fullName = nameParts || row["Nickname"] || `Contact ${index + 1}`

      // Extract emails
      const emails: string[] = []
      if (row["E-mail 1 - Value"]) emails.push(row["E-mail 1 - Value"])
      if (row["E-mail 2 - Value"]) emails.push(row["E-mail 2 - Value"])

      // Extract phones
      const phones: string[] = []
      if (row["Phone 1 - Value"]) phones.push(row["Phone 1 - Value"])
      if (row["Phone 2 - Value"]) phones.push(row["Phone 2 - Value"])

      // Extract company and role
      const company = row["Organization Name"] || undefined
      const role = row["Organization Title"] || undefined
      const department = row["Organization Department"]
      
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