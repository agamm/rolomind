import type { RawContactData, Contact } from "@/types/contact"

export function parseCSV(csvContent: string): RawContactData[] {
  const lines = csvContent.trim().split("\n")
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row")
  }

  const headers = parseCSVLine(lines[0])
  const data: RawContactData[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue // Skip empty lines

    const row: RawContactData = {}
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || ""
    })

    data.push(row)
  }

  return data
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      result.push(current)
      current = ""
      i++
    } else {
      current += char
      i++
    }
  }

  result.push(current)
  return result
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
