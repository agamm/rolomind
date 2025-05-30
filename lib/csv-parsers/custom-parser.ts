import Papa from 'papaparse'
import type { Contact } from "@/types/contact"
import type { CSVParser, ParsedCSVRow } from "./types"

export class CustomParser implements CSVParser {
  name = "Custom"

  canParse(_csvContent: string, headers: string[]): boolean {
    // This is the fallback parser - it can parse any CSV
    // We just need at least a name field or similar
    const nameHeaders = ['name', 'first name', 'last name', 'full name', 'contact name']
    
    return headers.some(header => 
      nameHeaders.some(nameHeader => 
        header.toLowerCase().includes(nameHeader)
      )
    )
  }

  parse(csvContent: string): Contact[] {
    const parseResult = Papa.parse<ParsedCSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string) => value.trim()
    })

    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors)
    }

    return parseResult.data.map((row, index) => {
      // Try to extract name from various possible field combinations
      let name = ""
      
      if (row["Name"]) {
        name = row["Name"]
      } else if (row["Full Name"]) {
        name = row["Full Name"]
      } else if (row["Contact Name"]) {
        name = row["Contact Name"]
      } else if (row["First Name"] || row["Last Name"]) {
        name = `${row["First Name"] || ""} ${row["Last Name"] || ""}`.trim()
      } else {
        // Try to find any field that might contain a name
        const possibleNameFields = Object.keys(row).filter(key =>
          key.toLowerCase().includes('name')
        )
        if (possibleNameFields.length > 0) {
          name = row[possibleNameFields[0]]
        }
      }

      if (!name) {
        name = `Contact ${index + 1}`
      }

      // Extract email from common email field names
      const emailFields = ['email', 'email address', 'e-mail', 'mail']
      const email = emailFields.reduce((found, field) => {
        if (found) return found
        const matchingKey = Object.keys(row).find(key =>
          key.toLowerCase().includes(field)
        )
        return matchingKey ? row[matchingKey] : ""
      }, "")

      // Extract phone from common phone field names
      const phoneFields = ['phone', 'phone number', 'mobile', 'cell', 'telephone']
      const phone = phoneFields.reduce((found, field) => {
        if (found) return found
        const matchingKey = Object.keys(row).find(key =>
          key.toLowerCase().includes(field)
        )
        return matchingKey ? row[matchingKey] : ""
      }, "")

      // Build notes from remaining fields
      const usedFields = new Set(['name', 'full name', 'contact name', 'first name', 'last name'])
      emailFields.forEach(field => usedFields.add(field))
      phoneFields.forEach(field => usedFields.add(field))

      const noteFields = Object.keys(row).filter(key =>
        !usedFields.has(key.toLowerCase()) && row[key]
      )

      const notes = noteFields.map(field => `${field}: ${row[field]}`).join('; ')

      const contact: Contact = {
        id: `custom-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 11)}`,
        name,
        contactInfo: {
          emails: email ? [email] : [],
          phones: phone ? [phone] : [],
          linkedinUrls: []
        },
        notes,
        source: "manual",
        createdAt: new Date(),
        updatedAt: new Date()
      }

      return contact
    }).filter(contact => contact.name.trim().length > 0)
  }
}