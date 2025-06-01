import type { RawContactData, Contact } from "@/types/contact"
import Papa from 'papaparse'

export function parseCSV(csvContent: string): RawContactData[] {
  const parseResult = Papa.parse<RawContactData>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  })

  if (parseResult.errors.length > 0) {
    throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`)
  }

  if (parseResult.data.length === 0) {
    throw new Error("CSV must have at least a header row and one data row")
  }

  return parseResult.data
}

export async function parseCsvFile(file: File): Promise<Contact[]> {
  const content = await file.text()
  const rawData = parseCSV(content)
  
  return rawData.map((row, index) => {
    const contact: Contact = {
      id: `imported-${Date.now()}-${index}`,
      name: row["First Name"] + " " + row["Last Name"] || row["Name"] || `Contact ${index + 1}`,
      contactInfo: {
        emails: row["Email Address"] ? [row["Email Address"]] : [],
        phones: row["Phone Number"] ? [row["Phone Number"]] : [],
        linkedinUrls: row["LinkedIn URL"] ? [row["LinkedIn URL"]] : []
      },
      notes: row["Notes"] || "",
      source: "manual" as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    return contact
  })
}
