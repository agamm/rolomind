import { NextRequest } from "next/server"
import { CSVParserFactory } from "@/lib/csv-parsers/parser-factory"

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

    return Response.json({ 
      success: true, 
      contacts: result.contacts,
      parserUsed: result.parserUsed,
      totalImported: result.contacts.length
    })
  } catch (error) {
    console.error("Error parsing CSV:", error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to parse CSV" 
    }, { status: 500 })
  }
}