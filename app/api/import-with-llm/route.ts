import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import Papa from 'papaparse'
import { normalizeCsvBatch } from "@/lib/csv-parsers/llm-normalizer"
import { findDuplicates } from "@/lib/contact-merger"
import type { Contact, RawContactData } from "@/types/contact"

const dataFilePath = path.join(process.cwd(), "data", "contacts.json")

async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data")
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function loadExistingContacts(): Promise<Contact[]> {
  try {
    await ensureDataDirectory()
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

    // Parse CSV to get raw data
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

    // Normalize contacts using LLM
    const { normalized, errors } = await normalizeCsvBatch(rows, headers)

    // Load existing contacts
    const existingContacts = await loadExistingContacts()

    // Find duplicates for each normalized contact
    const contactsWithDuplicates = normalized.map(contact => {
      const duplicates = findDuplicates(existingContacts, contact)
      return { contact, duplicates }
    })

    // Separate contacts with and without duplicates
    const uniqueContacts = contactsWithDuplicates
      .filter(item => item.duplicates.length === 0)
      .map(item => item.contact as Contact)
    
    const duplicatesFound = contactsWithDuplicates
      .filter(item => item.duplicates.length > 0)
      .flatMap(item => item.duplicates)

    return NextResponse.json({ 
      success: true,
      processed: {
        total: rows.length,
        normalized: normalized.length,
        unique: uniqueContacts.length,
        duplicates: duplicatesFound.length,
        errors: errors.length
      },
      uniqueContacts,
      duplicates: duplicatesFound,
      errors
    })
  } catch (error) {
    console.error("Error importing CSV with LLM:", error)
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
      if (contact.mergeWithId) {
        // This is a merge operation
        existingMap.set(contact.mergeWithId, contact)
      } else {
        // This is a new contact
        existingMap.set(contact.id, contact)
      }
    }
    
    // Convert back to array
    const finalContacts = Array.from(existingMap.values())
    
    // Save to file
    await ensureDataDirectory()
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