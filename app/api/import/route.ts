import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import Papa from 'papaparse'
import * as linkedinParser from "@/lib/csv-parsers/linkedin-parser"
import * as rolodexParser from "@/lib/csv-parsers/rolodex-parser"
import * as customParser from "@/lib/csv-parsers/custom-parser"
import { findDuplicates } from "@/lib/contact-merger"
import type { Contact, RawContactData } from "@/types/contact"

const dataFilePath = path.join(process.cwd(), "data", "contacts.json")

async function loadExistingContacts(): Promise<Contact[]> {
  try {
    const dataDir = path.dirname(dataFilePath)
    await fs.mkdir(dataDir, { recursive: true })
    const data = await fs.readFile(dataFilePath, "utf-8")
    return JSON.parse(data) as Contact[]
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return []
    }
    throw error
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

    if (parseResult.errors.length > 0) {
      console.error("CSV parsing errors:", parseResult.errors)
      return NextResponse.json({ 
        success: false, 
        error: "Failed to parse CSV: " + parseResult.errors[0].message 
      }, { status: 400 })
    }

    const headers = parseResult.meta.fields || []
    const rows = parseResult.data
    
    // Check if we're in detection phase (quick check)
    const phase = request.nextUrl.searchParams.get('phase')
    
    if (phase === 'detect' || !phase) {
      // Quick detection phase - just determine the parser type
      let parserType = 'custom' // default (AI)
      
      if (rolodexParser.isApplicableParser(headers)) {
        parserType = 'rolodex'
      } else if (linkedinParser.isApplicableParser(headers)) {
        parserType = 'linkedin'
      }
      
      return NextResponse.json({ 
        success: true,
        phase: 'detection',
        parserUsed: parserType,
        rowCount: rows.length
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
    } else {
      // Use custom parser (AI) for other formats
      normalizedContacts = await customParser.parse(content)
      parserUsed = 'custom'
    }

    // Load existing contacts
    const existingContacts = await loadExistingContacts()

    // Find duplicates
    const contactsWithDuplicates = normalizedContacts.map(contact => {
      const duplicates = findDuplicates(existingContacts, contact)
      return { contact, duplicates }
    })

    // Return data for client-side duplicate resolution
    const uniqueContacts = contactsWithDuplicates
      .filter(item => item.duplicates.length === 0)
      .map(item => item.contact as Contact)
    
    const duplicatesFound = contactsWithDuplicates
      .filter(item => item.duplicates.length > 0)
      .flatMap(item => item.duplicates)

    return NextResponse.json({ 
      success: true,
      phase: 'complete',
      processed: {
        total: rows.length,
        normalized: normalizedContacts.length,
        unique: uniqueContacts.length,
        duplicates: duplicatesFound.length
      },
      uniqueContacts,
      duplicates: duplicatesFound,
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

// New endpoint to save contacts after duplicate resolution
export async function PUT(request: NextRequest) {
  try {
    const { contacts } = await request.json()
    
    if (!Array.isArray(contacts)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid contacts data" 
      }, { status: 400 })
    }

    // Load existing contacts
    const existingContacts = await loadExistingContacts()
    
    // Create a map for faster lookup
    const existingMap = new Map(existingContacts.map(c => [c.id, c]))
    
    // Process contacts (either new or merged)
    for (const contact of contacts) {
      // Simply set by ID - merged contacts will replace existing ones
      existingMap.set(contact.id, contact)
    }
    
    // Convert back to array
    const finalContacts = Array.from(existingMap.values())
    
    // Save to file
    const dataDir = path.dirname(dataFilePath)
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(dataFilePath, JSON.stringify(finalContacts, null, 2))
    
    return NextResponse.json({ 
      success: true,
      totalContacts: finalContacts.length,
      saved: contacts.length
    })
  } catch (error) {
    console.error("Error saving contacts:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save contacts" 
    }, { status: 500 })
  }
}