import Papa from 'papaparse'
import type { Contact } from "@/types/contact"

export function isApplicableParser(headers: string[]): boolean {
  // Check if this is a simple contacts CSV with common headers
  // This parser handles CSVs with Name, Company, Title/Role, Email, etc.
  // Also handles the app's own export format with plural fields
  
  // Check for required fields - must have Name and either Email/Emails
  const hasName = headers.some(h => h.toLowerCase() === 'name')
  const hasEmail = headers.some(h => h.toLowerCase() === 'email' || h.toLowerCase() === 'emails')
  const hasCompany = headers.some(h => h.toLowerCase() === 'company')
  
  // Must have name and email at minimum
  if (!hasName || !hasEmail) return false
  
  // Check for optional headers that indicate this is a Rolodex-style CSV
  const optionalHeaders = [
    'title', 'role', 'phone', 'phones', 'linkedin', 'linkedin url', 
    'location', 'notes', 'other urls', 'source', 'created date', 'updated date'
  ]
  
  // Should have at least one optional header to distinguish from too-simple CSVs
  const hasOptionalHeaders = optionalHeaders.some(header =>
    headers.some(h => h.toLowerCase() === header)
  )
  
  // If it has Company and at least one optional field, it's likely a Rolodex CSV
  return hasCompany && hasOptionalHeaders
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
      // Handle single values (simple CSV format)
      const emails = row["Email"] ? [row["Email"].trim()] : 
                    (row["Emails"] ? row["Emails"].split(';').map(e => e.trim()).filter(Boolean) : [])
      const phones = row["Phone"] ? [row["Phone"].trim()] :
                    (row["Phones"] ? row["Phones"].split(';').map(p => p.trim()).filter(Boolean) : [])
      
      // Parse LinkedIn URL - handle both "LinkedIn" and "LinkedIn URL" columns
      const linkedinUrl = row["LinkedIn URL"] || row["LinkedIn"] || undefined
      
      // Parse other URLs
      const otherUrlsString = row["Other URLs"] || ""
      const otherUrls: { platform: string; url: string }[] = []
      
      if (otherUrlsString) {
        // Parse format like "Twitter: https://twitter.com/user; GitHub: https://github.com/user"
        const urlPairs = otherUrlsString.split(';').map(s => s.trim()).filter(Boolean)
        for (const pair of urlPairs) {
          const colonIndex = pair.indexOf(':')
          if (colonIndex > 0) {
            const platform = pair.substring(0, colonIndex).trim()
            const url = pair.substring(colonIndex + 1).trim()
            if (platform && url) {
              otherUrls.push({ platform, url })
            }
          }
        }
      }

      const contact: Contact = {
        id: `rolodex-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 11)}`,
        name: row["Name"] || `Contact ${index + 1}`,
        company: row["Company"] || undefined,
        role: row["Role"] || row["Title"] || undefined,
        location: row["Location"] || undefined,
        contactInfo: {
          emails,
          phones,
          linkedinUrl,
          otherUrls
        },
        notes: row["Notes"] || "",
        source: (row["Source"] as "google" | "linkedin" | "manual") || "manual",
        createdAt: row["Created Date"] ? new Date(row["Created Date"]) : new Date(),
        updatedAt: row["Updated Date"] ? new Date(row["Updated Date"]) : new Date()
      }

    return contact
  })
}