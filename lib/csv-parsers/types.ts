import type { Contact } from "@/types/contact"

export interface CSVParser {
  canParse(csvContent: string, headers: string[]): boolean
  parse(csvContent: string): Contact[]
  name: string
}

export interface ParsedCSVRow {
  [key: string]: string
}