import { NextRequest, NextResponse } from "next/server"
import Papa from 'papaparse'
import * as linkedinParser from "./parsers/linkedin-parser"
import * as rolodexParser from "./parsers/rolodex-parser"
import * as googleParser from "./parsers/google-parser"
import * as customParser from "./parsers/custom-parser"
import type { Contact, RawContactData } from "@/types/contact"
import { getServerSession, getUserCredits } from '@/lib/auth/server'
import { CreditCost } from '@/lib/credit-costs'

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
      } else if (googleParser.isApplicableParser(headers)) {
        parserType = 'google'
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
    } else if (parserType === 'google' || (!parserType && googleParser.isApplicableParser(headers))) {
      normalizedContacts = googleParser.parse(content)
      parserUsed = 'google'
    } else {
      // Check authentication and credits for AI normalization
      const session = await getServerSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Check if user has enough credits for AI normalization
      const credits = await getUserCredits();
      const requiredCredits = Math.ceil(rows.length / 100) * CreditCost.IMPORT_CONTACTS;
      
      if (!credits || credits.remaining < requiredCredits) {
        return NextResponse.json({ 
          error: `Insufficient credits for AI normalization. Need ${requiredCredits} credits but only have ${credits?.remaining || 0}.`,
          required: requiredCredits,
          remaining: credits?.remaining || 0
        }, { status: 402 });
      }

      // Use custom parser (AI) for other formats
      normalizedContacts = await customParser.parse(content)
      parserUsed = 'custom'
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