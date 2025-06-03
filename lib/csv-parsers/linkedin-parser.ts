import Papa from 'papaparse'
import type { Contact } from "@/types/contact"

export function isApplicableParser(headers: string[]): boolean {
  // LinkedIn CSV typically has these required headers
  const requiredHeaders = ['First Name', 'Last Name', 'URL']
  const optionalHeaders = ['Email Address', 'Company', 'Position', 'Connected On']
  
  // Check if we have the core LinkedIn headers
  const hasRequiredHeaders = requiredHeaders.every(header => 
    headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
  )
  
  // Check if we have some optional LinkedIn-specific headers
  const hasOptionalHeaders = optionalHeaders.some(header =>
    headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
  )
  
  return hasRequiredHeaders && hasOptionalHeaders
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
      const firstName = row["First Name"] || ""
      const lastName = row["Last Name"] || ""
      const fullName = `${firstName} ${lastName}`.trim() || `Contact ${index + 1}`

      // Extract structured fields
      const company = row["Company"] || undefined
      const position = row["Position"] || undefined
      const connectedOn = row["Connected On"] || ""
      
      // Only put non-structured data in notes
      let notes = ""
      if (connectedOn) notes = `LinkedIn connected: ${connectedOn}`

      const contact: Contact = {
        id: `linkedin-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 11)}`,
        name: fullName,
        company,
        role: position,
        location: undefined, // LinkedIn doesn't export location by default
        contactInfo: {
          emails: row["Email Address"] ? [row["Email Address"]] : [],
          phones: [], // LinkedIn exports typically don't include phone numbers
          linkedinUrl: row["URL"] || undefined,
          otherUrls: []
        },
        notes,
        source: "linkedin",
        createdAt: new Date(),
        updatedAt: new Date()
      }

      return contact
  }).filter(contact => contact.name.trim() !== '')
}