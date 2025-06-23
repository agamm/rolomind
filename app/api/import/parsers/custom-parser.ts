import type { Contact } from "@/types/contact"
import { normalizeCsvBatch } from './llm-normalizer'

// This parser handles any CSV format using AI
export function isApplicableParser(): boolean {
  // This is the fallback parser - always returns true
  // It will use AI to understand any CSV format
  return true
}

export async function parse(csvContent: string): Promise<Contact[]> {
  // Parse CSV to get rows
  const Papa = (await import('papaparse')).default
  const parseResult = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transform: (value: string) => value.trim()
  })

  if (parseResult.errors.length > 0) {
    console.warn('CSV parsing warnings:', parseResult.errors)
  }

  const headers = parseResult.meta.fields || []
  const rows = parseResult.data

  console.log('Custom parser - headers:', headers)
  console.log('Custom parser - row count:', rows.length)
  console.log('Custom parser - sample row:', rows[0])

  // Filter out empty rows
  const validRows = rows.filter(row => {
    // Check if row has any non-empty values
    return Object.values(row).some(value => value && value.toString().trim() !== '')
  })

  console.log('Custom parser - valid rows:', validRows.length)

  if (validRows.length === 0) {
    throw new Error('No valid data rows found in CSV file')
  }

  // Use AI to normalize the data
  const { normalized, errors } = await normalizeCsvBatch(validRows, headers)
  
  if (errors.length > 0) {
    console.warn('Normalization errors:', errors)
  }

  console.log('Custom parser - normalized contacts:', normalized.length)

  return normalized
}