import { NextRequest } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { CSVParserFactory } from "@/lib/csv-parsers/parser-factory"
import type { Contact } from "@/types/contact"

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
      return Response.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return Response.json({ success: false, error: "Please upload a CSV file" }, { status: 400 })
    }

    const content = await file.text()
    
    if (!content.trim()) {
      return Response.json({ success: false, error: "CSV file is empty" }, { status: 400 })
    }

    const parserFactory = new CSVParserFactory()
    const result = parserFactory.detectAndParse(content)

    // Load existing contacts and merge with new ones
    const existingContacts = await loadExistingContacts()
    const allContacts = [...existingContacts, ...result.contacts]

    // Save merged contacts back to file
    await ensureDataDirectory()
    await fs.writeFile(dataFilePath, JSON.stringify(allContacts, null, 2))

    return Response.json({ 
      success: true, 
      contacts: result.contacts,
      parserUsed: result.parserUsed,
      totalImported: result.contacts.length
    })
  } catch (error) {
    console.error("Error importing CSV:", error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to import CSV" 
    }, { status: 500 })
  }
}