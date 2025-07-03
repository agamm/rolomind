import { NextRequest, NextResponse } from "next/server"
import { detectParserType, parsePreviewRow } from "../import/route"
import type { RawContactData } from "@/types/contact"

export async function POST(request: NextRequest) {
  try {
    const { headers, sampleRow, parserType } = await request.json()

    if (!headers || !Array.isArray(headers)) {
      return NextResponse.json({ error: "Headers are required" }, { status: 400 })
    }

    if (!sampleRow || typeof sampleRow !== 'object') {
      return NextResponse.json({ error: "Sample row is required" }, { status: 400 })
    }

    // Use provided parser type or detect it
    const finalParserType = parserType || detectParserType(headers)
    
    // Parse the preview row
    const previewContact = await parsePreviewRow(headers, sampleRow as RawContactData, finalParserType)
    
    return NextResponse.json({
      success: true,
      parserType: finalParserType,
      previewContact
    })
  } catch (error) {
    console.error("Error in import preview:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate preview" 
    }, { status: 500 })
  }
}