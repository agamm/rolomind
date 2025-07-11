import { NextRequest, NextResponse } from "next/server"
import Papa from 'papaparse'
import * as linkedinParser from "./parsers/linkedin-parser"
import * as rolodexParser from "./parsers/rolodex-parser"
import * as googleParser from "./parsers/google-parser"
import * as customParser from "./parsers/custom-parser"
import type { Contact, RawContactData } from "@/types/contact"
import { getServerSession } from '@/lib/auth/server'

// Export parser detection function
export function detectParserType(headers: string[]): string {
  if (rolodexParser.isApplicableParser(headers)) {
    return 'rolodex'
  } else if (linkedinParser.isApplicableParser(headers)) {
    return 'linkedin'
  } else if (googleParser.isApplicableParser(headers)) {
    return 'google'
  }
  return 'custom' // default (AI)
}

// Export function to parse a single row for preview
export async function parsePreviewRow(
  headers: string[], 
  row: RawContactData, 
  parserType: string
): Promise<Partial<Contact> | null> {
  try {
    switch (parserType) {
      case 'rolodex': {
        const csvContent = [headers.join(','), Object.values(row).join(',')].join('\n')
        const contacts = rolodexParser.parse(csvContent)
        return contacts[0] || null
      }
      case 'linkedin': {
        const csvContent = [headers.join(','), Object.values(row).join(',')].join('\n')
        const contacts = linkedinParser.parse(csvContent)
        return contacts[0] || null
      }
      case 'google': {
        const csvContent = [headers.join(','), Object.values(row).join(',')].join('\n')
        const contacts = googleParser.parse(csvContent)
        return contacts[0] || null
      }
      case 'custom':
      case 'llm-normalizer': {
        // For AI normalization, try to use the LLM normalizer
        try {
          const { normalizeContactWithLLM } = await import('./parsers/llm-normalizer')
          return await normalizeContactWithLLM(row, headers)
        } catch (error) {
          console.error('LLM preview error:', error)
          // Fallback: return a basic preview based on the row data
          const name = row['Name'] || row['name'] || row['Full Name'] || Object.values(row)[0] || 'Contact'
          const company = row['Company'] || row['company'] || row['Job']?.split('@')[1]?.trim()
          const role = row['Role'] || row['role'] || row['Job']?.split('@')[0]?.trim()
          const location = row['Location'] || row['location'] || row['City']
          const email = row['Email'] || row['email']
          const phone = row['Phone'] || row['phone']
          const notes = row['Notes'] || row['notes'] || row['Met at']
          
          return {
            name,
            company,
            role,
            location,
            contactInfo: {
              emails: email ? [email] : [],
              phones: phone ? [phone] : [],
              linkedinUrl: row['LinkedIn'] || row['linkedin'] || undefined,
              otherUrls: []
            },
            notes: notes || ''
          }
        }
      }
      default:
        return null
    }
  } catch (error) {
    console.error('Preview parsing error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ success: false, error: "Please upload a CSV file" }, { status: 400 })
    }

    const content = await file.text()
    
    if (!content.trim()) {
      return NextResponse.json({ success: false, error: "CSV file is empty" }, { status: 400 })
    }

    // Parse CSV to check headers
    const parseResult = Papa.parse<RawContactData>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    })

    // Don't immediately fail on parsing errors - some formats (like LinkedIn Notes) expect errors during header detection
    if (parseResult.errors.length > 0) {
      console.warn("CSV parsing warnings during header detection:", parseResult.errors.slice(0, 3))
    }

    const headers = parseResult.meta.fields || []
    const rows = parseResult.data
    
    // Check if we're in detection phase (quick check)
    const phase = request.nextUrl.searchParams.get('phase')
    
    if (phase === 'detect' || !phase) {
      // Quick detection phase - just determine the parser type
      const parserType = detectParserType(headers)
      
      // Get proper headers and first row using parser-specific logic
      let actualHeaders: string[] = headers
      let firstRow: Record<string, string> | null = rows[0] || null
      
      if (parserType === 'linkedin') {
        const result = linkedinParser.getFirstDataRow(content)
        actualHeaders = result.headers
        firstRow = result.firstRow
      } else if (parserType === 'google') {
        const result = googleParser.getFirstDataRow(content)
        actualHeaders = result.headers
        firstRow = result.firstRow
      } else if (parserType === 'rolodex') {
        const result = rolodexParser.getFirstDataRow(content)
        actualHeaders = result.headers
        firstRow = result.firstRow
      }
      
      return NextResponse.json({ 
        success: true,
        phase: 'detection',
        parserUsed: parserType,
        rowCount: rows.length,
        headers: actualHeaders,
        firstRow: firstRow
      })
    }
    
    // Processing phase - do the actual work
    let normalizedContacts: Contact[] = []
    let parserUsed = 'unknown'
    
    // Use the appropriate parser based on detected type
    const parserType = request.nextUrl.searchParams.get('parserType')
    
    if (parserType === 'rolodex' || (!parserType && rolodexParser.isApplicableParser(headers))) {
      normalizedContacts = rolodexParser.parse(content)
      parserUsed = 'rolodex'
    } else if (parserType === 'linkedin' || (!parserType && linkedinParser.isApplicableParser(headers))) {
      normalizedContacts = linkedinParser.parse(content)
      parserUsed = 'linkedin'
    } else if (parserType === 'google' || (!parserType && googleParser.isApplicableParser(headers))) {
      normalizedContacts = googleParser.parse(content)
      parserUsed = 'google'
    } else {
      // Check authentication for AI normalization
      const session = await getServerSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      console.log('Using custom parser for AI normalization')
      console.log('Row count:', rows.length)
      
      // Use custom parser (AI) for other formats
      try {
        normalizedContacts = await customParser.parse(content)
        parserUsed = 'custom'
        console.log('Custom parser returned', normalizedContacts.length, 'contacts')
      } catch (error) {
        console.error('Custom parser error:', error)
        
        // If custom parser fails and we had initial parsing errors, provide a helpful error
        if (parseResult.errors.length > 0) {
          return NextResponse.json({ 
            success: false, 
            error: "Failed to parse CSV: " + parseResult.errors[0].message + ". Please check your CSV format." 
          }, { status: 400 })
        }
        
        throw error
      }
    }

    // Return normalized contacts for client-side duplicate checking
    return NextResponse.json({ 
      success: true,
      phase: 'complete',
      processed: {
        total: rows.length,
        normalized: normalizedContacts.length
      },
      contacts: normalizedContacts,
      parserUsed
    })
  } catch (error) {
    console.error("Error importing CSV:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to import CSV" 
    }, { status: 500 })
  }
}

// This endpoint is no longer needed - saving happens client-side
export async function PUT() {
  return NextResponse.json({ 
    success: false, 
    error: "This endpoint is deprecated. Use client-side storage instead." 
  }, { status: 410 })
}