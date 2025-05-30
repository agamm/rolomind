import Papa from 'papaparse'
import type { Contact } from "@/types/contact"
import type { CSVParser } from "./types"
import { LinkedInParser } from "./linkedin-parser"
import { CustomParser } from "./custom-parser"

export class CSVParserFactory {
  private parsers: CSVParser[] = [
    new LinkedInParser(),
    new CustomParser(), // Always keep this last as fallback
  ]

  detectAndParse(csvContent: string): { contacts: Contact[], parserUsed: string } {
    // First, parse just the headers to detect format
    const headerResult = Papa.parse(csvContent, {
      header: false,
      preview: 1,
      skipEmptyLines: true
    })

    if (headerResult.errors.length > 0) {
      throw new Error(`Failed to parse CSV headers: ${headerResult.errors[0].message}`)
    }

    const headers = headerResult.data[0] as string[]
    if (!headers || headers.length === 0) {
      throw new Error("CSV file appears to be empty or invalid")
    }

    // Try each parser to see which one can handle this CSV
    for (const parser of this.parsers) {
      if (parser.canParse(csvContent, headers)) {
        try {
          const contacts = parser.parse(csvContent)
          return {
            contacts,
            parserUsed: parser.name
          }
        } catch (error) {
          console.warn(`Parser ${parser.name} failed:`, error)
          continue
        }
      }
    }

    throw new Error("No suitable parser found for this CSV format")
  }

  getAvailableParsers(): string[] {
    return this.parsers.map(p => p.name)
  }
}