import type { RawContactData } from "@/types/contact"

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
