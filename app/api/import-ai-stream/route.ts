import { NextRequest } from "next/server"
import Papa from 'papaparse'
import * as linkedinParser from "../import/parsers/linkedin-parser"
import * as rolodexParser from "../import/parsers/rolodex-parser"
import * as googleParser from "../import/parsers/google-parser"
import { Contact } from '@/types/contact'
import { createJsonStream } from '@/lib/stream-utils'
import { getServerSession, getUserCredits } from '@/lib/auth/server'
import { CreditCost } from '@/lib/credit-costs'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const phase = request.nextUrl.searchParams.get('phase')
  
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 })
  }

  const text = await file.text()
  const parseResult = Papa.parse(text, { header: true, skipEmptyLines: true })
  const headers = parseResult.meta.fields || []
  const allRows = parseResult.data as Record<string, string>[]
  
  // Filter out empty rows
  const rows = allRows.filter(row => {
    return Object.values(row).some(value => value && value.toString().trim() !== '')
  })
  
  // Detect parser type
  let parserUsed = 'custom' // default
  
  if (rolodexParser.isApplicableParser(headers)) {
    parserUsed = 'rolodex'
  } else if (linkedinParser.isApplicableParser(headers)) {
    parserUsed = 'linkedin'
  } else if (googleParser.isApplicableParser(headers)) {
    parserUsed = 'google'
  }
  
  if (phase === 'detect') {
    return new Response(JSON.stringify({
      success: true,
      phase: 'detection',
      parserUsed,
      rowCount: rows.length
    }))
  }

  // Stream processing for custom parser (AI)
  if (parserUsed === 'custom') {
    // Check authentication first
    const session = await getServerSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    // Check if user has enough credits for AI normalization
    const credits = await getUserCredits();
    const requiredCredits = Math.ceil(rows.length / 100) * CreditCost.IMPORT_CONTACTS;
    
    if (!credits || credits.remaining < requiredCredits) {
      return new Response(JSON.stringify({ 
        error: `Insufficient credits for AI normalization. Need ${requiredCredits} credits but only have ${credits?.remaining || 0}.`,
        required: requiredCredits,
        remaining: credits?.remaining || 0
      }), { status: 402 });
    }

    async function* generateProgress() {
      const { Semaphore } = await import('@/lib/semaphore')
      const { normalizeContactWithLLM } = await import('../import/parsers/llm-normalizer')
      
      const BATCH_SIZE = 25
      const MAX_CONCURRENT = 5
      const semaphore = new Semaphore(MAX_CONCURRENT)
      
      const totalRows = rows.length
      const normalizedContacts: Contact[] = []
      const errors: string[] = []
      let processed = 0
      let failed = 0
      
      // Yield initial progress
      yield { type: 'progress', current: 0, total: totalRows }
      
      // Process in batches
      for (let i = 0; i < totalRows; i += BATCH_SIZE) {
        const batch = rows.slice(i, Math.min(i + BATCH_SIZE, totalRows))
        
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}, rows ${i + 1}-${i + batch.length} of ${totalRows}`)
        
        // Process batch with semaphore control
        const batchPromises = batch.map(async (row, batchIndex) => {
          const rowIndex = i + batchIndex
          return semaphore.withLock(async () => {
            try {
              const contact = await normalizeContactWithLLM(row, headers)
              return { success: true, contact, index: rowIndex }
            } catch (error) {
              const errorMsg = `Row ${rowIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
              console.error('Failed to normalize contact:', errorMsg)
              errors.push(errorMsg)
              return { success: false, error, index: rowIndex }
            }
          })
        })
        
        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises)
        
        // Process results and update progress
        for (const result of batchResults) {
          processed++
          if (result.success && result.contact) {
            normalizedContacts.push(result.contact as Contact)
          } else {
            failed++
          }
          // Yield progress update
          yield { type: 'progress', current: processed, total: totalRows }
        }
        
        // Small delay between batches
        if (i + BATCH_SIZE < totalRows) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      // Check if all failed
      if (normalizedContacts.length === 0 && failed > 0) {
        throw new Error(`AI normalization failed for all ${failed} contacts. ${errors.length > 0 ? 'First error: ' + errors[0] : 'Check your API key and try again.'}`)
      }
      
      // Yield final result with normalized contacts
      yield {
        type: 'complete',
        processed: {
          total: totalRows,
          normalized: normalizedContacts.length,
          failed: failed
        },
        contacts: normalizedContacts,
        parserUsed,
        errors: errors.slice(0, 5) // Include first 5 errors
      }
    }
    
    try {
      return createJsonStream(generateProgress)
    } catch (error) {
      console.error('Stream generation error:', error)
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to process contacts'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // For non-custom parsers, use regular parsing
  let contacts: Contact[] = []
  
  if (parserUsed === 'rolodex') {
    contacts = rolodexParser.parse(text)
  } else if (parserUsed === 'linkedin') {
    contacts = linkedinParser.parse(text)
  } else if (parserUsed === 'google') {
    contacts = googleParser.parse(text)
  }
  
  return new Response(JSON.stringify({
    success: true,
    phase: 'complete',
    processed: {
      total: rows.length,
      normalized: contacts.length
    },
    contacts,
    parserUsed
  }))
}