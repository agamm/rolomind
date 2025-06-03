import Papa from 'papaparse'
import type { Contact } from "@/types/contact"

export function isApplicableParser(headers: string[]): boolean {
  // Check if this is a Rolodex export by looking for our specific headers
  const requiredHeaders = [
    'Name', 
    'Company', 
    'Role', 
    'Location', 
    'Emails', 
    'Phones', 
    'LinkedIn URL',
    'Other URLs',
    'Notes',
    'Source',
    'Created Date',
    'Updated Date'
  ]
  
  // All headers must match exactly (order doesn't matter)
  return requiredHeaders.every(header => headers.includes(header)) && 
         headers.length === requiredHeaders.length
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
      // Parse semi-colon separated values
      const emails = row["Emails"] ? row["Emails"].split(';').map(e => e.trim()).filter(Boolean) : []
      const phones = row["Phones"] ? row["Phones"].split(';').map(p => p.trim()).filter(Boolean) : []
      
      // Parse LinkedIn URL
      const linkedinUrl = row["LinkedIn URL"] || undefined
      
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
        role: row["Role"] || undefined,
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